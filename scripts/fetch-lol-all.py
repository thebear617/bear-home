#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 RESG 拉取全部英雄的海克斯数据 + 头像，生成画廊/抽屉所需的静态数据。

用法:
    python3 scripts/fetch-lol-all.py          # 全量
    python3 scripts/fetch-lol-all.py --no-heads   # 跳过头像下载（只生成数据）
    python3 scripts/fetch-lol-all.py --heros brand,kassadin  # 只处理部分英雄

输出:
    src/data/lol-heroes.js      全英雄索引 (id/中文名/alias/role/头像本地路径)
    src/data/lol-augments.js    全英雄海克斯推荐 (单/双/三/四 Top)
    public/assets/lol/champions/*.png  头像 (本地化)

数据源:
    https://api.resg.top (CORS 开放, 服务端直连)
    - /api/augments?version={V}      海克斯 id->中文名
    - /api/items?version={V}         装备 id->名称
    - /api/synergy?championId={id}   英雄海克斯组合胜率
    - /c/zh_cn/v1/champion-summary.json  英雄索引 (含 role)
头像: https://www.resg.top/c/champion-icons/{id}.png
"""
import json
import os
import sys
import time
import urllib.request

VERSION = "16.14"
API = "https://api.resg.top"
STATIC = "https://www.resg.top/c/zh_cn/v1"
HEAD_CDN = "https://www.resg.top/c/champion-icons/{id}.png"

TOP_N = 5
# 注意：不设最小场次过滤，直接按胜率降序取 Top {TOP_N}（数据少的英雄也能出结果）

# role 中文标签
ROLE_LABELS = {
    "fighter": "战士", "tank": "坦克", "mage": "法师",
    "assassin": "刺客", "support": "辅助", "marksman": "射手",
}
ROLE_ORDER = ["fighter", "tank", "mage", "assassin", "support", "marksman"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    skip_heads = "--no-heads" in sys.argv
    # 可选只跑部分英雄
    only = None
    if "--heros" in sys.argv:
        i = sys.argv.index("--heros")
        only = {h.strip() for h in sys.argv[i + 1].split(",")}

    # 1. 英雄索引
    champs = fetch(f"{STATIC}/champion-summary.json")
    heroes = [c for c in champs if c.get("id", -1) > 0]
    # 排除占位/特殊（id 对应真实英雄，role 为空的过滤）
    heroes = [c for c in heroes if c.get("roles")]
    print(f"英雄总数: {len(heroes)}")

    if only:
        by_alias = {c["alias"].lower(): c for c in heroes}
        heroes = [by_alias[h] for h in only if h in by_alias]
        print(f"仅处理: {len(heroes)}")

    # 2. 全局 augment/item
    augs = fetch(f"{API}/api/augments?version={VERSION}")
    items = fetch(f"{API}/api/items?version={VERSION}")
    aug_name = {a["id"]: a.get("display_name", f"aug{a['id']}") for a in augs}
    item_name = {it["item_id"]: it.get("name", f"item{it['item_id']}") for it in items}

    combo_types = ["AUG_1", "AUG_2", "AUG_3", "AUG_4"]
    combo_labels = {"AUG_1": "single", "AUG_2": "double", "AUG_3": "triple", "AUG_4": "quad"}

    # 2.5 英雄总体胜率/热度（用于画廊排序）
    champ_stats = {}
    try:
        stats = fetch(f"{API}/api/champions/stats?version={VERSION}")
        for s in stats:
            champ_stats[int(s["champion_id"])] = {
                "wr": float(s.get("avg_win_rate", 0)),
                "matches": int(s.get("total_matches", 0)),
            }
        print(f"英雄胜率/热度数据: {len(champ_stats)} 条")
    except Exception as e:
        print(f"!! 拉取 champions/stats 失败: {e}")

    # 3. 逐个英雄拉 synergy + 下载头像
    hero_index = []
    aug_data = {}
    used_aug = set()
    used_item = set()
    head_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "assets", "lol", "champions"))

    for c in heroes:
        cid = c["id"]
        alias = c["alias"].lower()
        roles = [r for r in ROLE_ORDER if r in c.get("roles", [])]
        if not roles:
            roles = ["fighter"]

        # 头像
        head_rel = f"/assets/lol/champions/{alias}.png"
        if not skip_heads:
            try:
                os.makedirs(head_dir, exist_ok=True)
                hp = os.path.join(head_dir, f"{alias}.png")
                if not os.path.exists(hp):
                    req = urllib.request.Request(HEAD_CDN.format(id=cid), headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=20) as r:
                        data = r.read()
                    with open(hp, "wb") as f:
                        f.write(data)
            except Exception as e:
                print(f"  头像失败 {alias}: {e}")

        st = champ_stats.get(cid, {})
        # RESG: c.name=称号(如黑暗之女), c.description=英雄名(如安妮)
        hero_name = c.get("description") or c.get("name", alias)
        hero_title = c.get("name") if hero_name != c.get("name") else None
        hero_index.append({
            "id": alias,
            "resgId": cid,
            "name": hero_name,
            "title": hero_title,             # 称号(可空)，用于搜索匹配
            "roles": roles,
            "icon": head_rel,
            "wr": st.get("wr", 0),          # 平均胜率 0~1
            "matches": st.get("matches", 0), # 总场次（热度）
        })

        # synergy
        try:
            syn = fetch(f"{API}/api/synergy?championId={cid}&version={VERSION}&tier=ALL&order=unordered&top=15&buildLimit=5")
        except Exception as e:
            print(f"  !! {alias} synergy 失败: {e}")
            continue

        by_type = {t: [] for t in combo_types}
        for s in syn:
            # 不设最小场次过滤：数据少的英雄也能按胜率列出 Top 组合
            if s.get("combo_type") in by_type:
                by_type[s["combo_type"]].append(s)
        for t in combo_types:
            by_type[t].sort(key=lambda x: x.get("win_rate", 0), reverse=True)

        hero_data = {}
        for t in combo_types:
            entries = by_type[t][:TOP_N]
            if not entries:
                continue
            aug_ids, winrates, matches, item_ids = [], [], [], []
            for s in entries:
                key = s.get("combo_key", "")
                ids = []
                for seg in key.replace("|", "-").split("-"):
                    if seg.startswith("A:"):
                        try:
                            ids.append(int(seg[2:]))
                        except ValueError:
                            pass
                aug_ids.append(ids)
                winrates.append(round(s.get("win_rate", 0), 4))
                matches.append(s.get("total_matches", 0))
                best = s.get("builds", [{}])[0].get("items", []) if s.get("builds") else []
                item_ids.append(best)
                used_aug.update(ids)
                used_item.update(best)
            hero_data[combo_labels[t]] = {"a": aug_ids, "w": winrates, "m": matches, "i": item_ids}

        aug_data[alias] = hero_data
        cnt = {k: len(hero_data.get(k, {}).get("a", [])) for k in ("single", "double", "triple", "quad")}
        print(f"  ✓ {alias}({c.get('description')}) 单{cnt['single']} 双{cnt['double']} 三{cnt['triple']} 四{cnt['quad']}")
        time.sleep(0.15)

    # 4. 生成文件
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "data"))

    heroes_js = json.dumps(hero_index, ensure_ascii=False)
    hero_out = f"""// AUTO-GENERATED by scripts/fetch-lol-all.py (RESG v{VERSION})
// 全英雄索引：画廊展示用，勿手改。
export const lolHeroes = {heroes_js};
// 定位 -> 中文标签
export const lolRoles = {json.dumps(ROLE_LABELS, ensure_ascii=False)};
"""
    with open(os.path.join(src_dir, "lol-heroes.js"), "w", encoding="utf-8") as f:
        f.write(hero_out)

    aug_map_js = json.dumps({k: v for k, v in aug_name.items() if k in used_aug}, ensure_ascii=False)
    item_map_js = json.dumps({k: v for k, v in item_name.items() if k in used_item}, ensure_ascii=False)
    data_js = json.dumps(aug_data, ensure_ascii=False)
    aug_out = f"""// AUTO-GENERATED by scripts/fetch-lol-all.py (RESG v{VERSION})
// 全英雄海克斯推荐：抽屉展示用，勿手改。
export const lolAugments = {data_js};
export const lolAugmentNames = {aug_map_js};
export const lolItemNames = {item_map_js};
"""
    with open(os.path.join(src_dir, "lol-augments.js"), "w", encoding="utf-8") as f:
        f.write(aug_out)

    print(f"\n✅ 生成 {os.path.join(src_dir, 'lol-heroes.js')} ({len(hero_index)} 英雄)")
    print(f"✅ 生成 {os.path.join(src_dir, 'lol-augments.js')} ({len(aug_data)} 英雄海克斯, {os.path.getsize(os.path.join(src_dir, 'lol-augments.js'))//1024} KB)")


if __name__ == "__main__":
    main()
