#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 RESG (海克斯大乱斗数据站) 批量拉取英雄海克斯推荐，生成静态数据供画廊抽屉展示。

用法:
    python3 scripts/fetch-lol-augments.py            # 全部画廊英雄
    python3 scripts/fetch-lol-augments.py --hero brand,kassadin   # 指定英雄

输出: src/data/lol-augments.js  (ESM, 供 Astro 引用)

数据源:
    API 基址 https://api.resg.top (CORS 开放, 服务端直连无限制)
    - /api/augments?version={V}     海克斯强化 id->中文名
    - /api/items?version={V}        装备 id->名称
    - /api/synergy?championId={id}  该英雄海克斯组合胜率
英雄 id 从静态 /c/zh_cn/v1/champion-summary.json 通过英文 alias 匹配。
"""
import json
import os
import sys
import time
import urllib.request

VERSION = "16.14"
API = "https://api.resg.top"
STATIC = "https://www.resg.top/c/zh_cn/v1"

# 画廊英雄: 英文 alias -> (中文简称)
HEROES = {
    "brand": "火男", "ziggs": "炸弹人", "malzahar": "蚂蚱", "hwei": "彗", "karthus": "死歌",
    "aurora": "阿萝拉", "leblanc": "妖姬", "syndra": "辛德拉", "zoe": "佐伊", "mel": "梅尔",
    "annie": "安妮", "neeko": "妮蔻", "fiddlesticks": "稻草人", "vladimir": "吸血鬼", "lissandra": "冰女",
    "ryze": "瑞兹",
    "samira": "莎弥拉", "lucian": "卢锡安", "yunara": "芸阿娜", "kogmaw": "大嘴",
    "sylas": "塞拉斯", "fizz": "小鱼人", "akali": "阿卡丽", "ekko": "艾克", "evelynn": "寡妇",
    "ezreal": "伊泽瑞尔", "jax": "武器", "kaisa": "卡莎",
    "diana": "皎月", "gwen": "格温", "kassadin": "卡萨丁", "lillia": "莉莉娅", "rumble": "兰博", "udyr": "乌迪尔",
}

# 每个 combo_type 保留 Top 数量
TOP_N = 5

# 最少场次阈值：过滤场次过少导致胜率虚高的组合
MIN_MATCHES = 50


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    # 1. 英雄 alias -> resg id
    champ_map = {}
    try:
        champs = fetch(f"{STATIC}/champion-summary.json")
        for c in champs:
            if c.get("id", -1) > 0:
                champ_map[c["alias"].lower()] = c["id"]
    except Exception as e:
        print("!! 拉取 champion-summary 失败:", e)
        sys.exit(1)

    # 2. 全局 augment / item 数据
    try:
        augs = fetch(f"{API}/api/augments?version={VERSION}")
        items = fetch(f"{API}/api/items?version={VERSION}")
    except Exception as e:
        print("!! 拉取 augments/items 失败:", e)
        sys.exit(1)

    aug_name = {a["id"]: a.get("display_name", f"aug{a['id']}") for a in augs}
    item_name = {it["item_id"]: it.get("name", f"item{it['item_id']}") for it in items}

    # 3. 逐个英雄拉 synergy
    result = {}
    combo_types = ["AUG_1", "AUG_2", "AUG_3", "AUG_4"]
    combo_labels = {"AUG_1": "single", "AUG_2": "double", "AUG_3": "triple", "AUG_4": "quad"}

    heroes_to_run = list(HEROES.items())
    if "--hero" in sys.argv:
        idx = sys.argv.index("--hero")
        sel = [h.strip() for h in sys.argv[idx + 1].split(",")]
        heroes_to_run = [(h, HEROES[h]) for h in sel if h in HEROES]

    for alias, zh in heroes_to_run:
        cid = champ_map.get(alias)
        if not cid:
            print(f"  !! {alias} 无 RESG id，跳过")
            continue
        try:
            syn = fetch(f"{API}/api/synergy?championId={cid}&version={VERSION}&tier=ALL&order=unordered&top=15&buildLimit=5")
        except Exception as e:
            print(f"  !! {alias} synergy 失败: {e}")
            continue

        # 按 combo_type 分组，过滤最小场次并按胜率降序排序
        by_type = {t: [] for t in combo_types}
        for s in syn:
            if s.get("combo_type") in by_type and s.get("total_matches", 0) >= MIN_MATCHES:
                by_type[s["combo_type"]].append(s)
        for t in combo_types:
            by_type[t].sort(key=lambda x: x.get("win_rate", 0), reverse=True)

        hero_data = {}
        for t in combo_types:
            entries = by_type[t][:TOP_N]
            if not entries:
                continue
            aug_ids = []
            winrates = []
            matches = []
            item_ids = []
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
            hero_data[combo_labels[t]] = {
                "a": aug_ids, "w": winrates, "m": matches, "i": item_ids
            }

        result[alias] = hero_data
        cnt = {k: len(hero_data.get(k, {}).get("a", [])) for k in ("single", "double", "triple", "quad")}
        print(f"  ✓ {alias}({zh}) cid={cid}: 单{cnt['single']} 双{cnt['double']} 三{cnt['triple']} 四{cnt['quad']}")
        time.sleep(0.2)

    # 4. 收集实际用到的海克斯与装备 id，生成精简映射
    used_aug_ids = set()
    used_item_ids = set()
    for alias, hero_data in result.items():
        for t in hero_data.values():
            for ids in t.get("a", []):
                used_aug_ids.update(ids)
            for items in t.get("i", []):
                used_item_ids.update(items)
    aug_map_js = json.dumps({k: v for k, v in aug_name.items() if k in used_aug_ids}, ensure_ascii=False)
    item_map_js = json.dumps({k: v for k, v in item_name.items() if k in used_item_ids}, ensure_ascii=False)
    data_js = json.dumps(result, ensure_ascii=False)

    out = f"""// AUTO-GENERATED by scripts/fetch-lol-augments.py (RESG v{VERSION})
// 英雄海克斯推荐静态数据：抽屉展示用，勿手改。更新方法见脚本注释。
export const lolAugments = {data_js};
// 海克斯 id -> 中文名
export const lolAugmentNames = {aug_map_js};
// 装备 id -> 名称
export const lolItemNames = {item_map_js};
"""

    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "lol-augments.js")
    out_path = os.path.abspath(out_path)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"\n✅ 已生成 {out_path} ({len(result)} 个英雄, {os.path.getsize(out_path)//1024} KB)")


if __name__ == "__main__":
    main()
