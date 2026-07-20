#!/usr/bin/env python3
"""
sync-timeline.py — 自动把各站点的「大版本」变更同步到 personal 个人开发时间线。

设计（2026-07-10 改版）：
  基准 = 个人开发时间线自己（personal/js/data.js 的 cookbookEntries），
  不再依赖任何外部 state 账本。时间轴即唯一真相源，永不脱节。

检测逻辑：
  1. 解析 data.js，算出每个站在时间轴里已记录的「最高 (major, minor)」。
  2. 遍历各仓库 main 分支所有带版本号 commit，按 (major, minor) 分组，
     每组取该系列最新 commit 作为代表（即该大版本的最新一次提交）。
  3. 凡是仓库里 (major, minor) 严格高于时间轴已记录的大版本 → 补一条记录。
     （patch 级 / 小版本不进时间轴；历史上被故意跳过的中间版本也不回填，
       因为只补「高于时间轴当前最高版本」的。）

新站处理：
  若某站在时间轴里一条记录都没有（如刚诞生），脚本不自动灌它的全部历史，
  只提示「请手动添加首条」，之后脚本会自动跟进后续大版本。

安全：
  - 不自动 git push（遵守用户「不要自动推送」铁律）。
  - 不自动 commit（仅改 data.js，留待用户审 diff）。
  - --dry-run 只打印将新增的记录，不改任何文件。

用法：
  python3 sync-timeline.py            # 检测并写入 data.js（不 commit / 不 push）
  python3 sync-timeline.py --dry-run  # 只打印将新增的记录，不写文件
  python3 sync-timeline.py --status   # 打印各站「时间轴最高版本 vs 仓库最新版本」对照表
"""
import subprocess
import re
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent          # htmls/
DATA_JS = ROOT / "personal" / "js" / "data.js"

# 仓库目录名 → 中文站名（与时间轴 tags[0] 一致）
SITES = {
    "home": "猪窝",
    "personal": "熊窝",
    "devnotes": "开发笔记",
    "reanotes": "科研笔记",
    "lifenotes": "常识笔记",
    "cats": "猫猫",
}
ZH_TO_REPO = {zh: repo for repo, zh in SITES.items()}

FULL_RE = re.compile(r"\b(v\d+\.\d+\.\d+)\b")
VER_RE = re.compile(r"v(\d+)\.(\d+)\.(\d+)")
# 匹配一条 entry 的 title + tags（顺序固定 id→title→date→tags）
ENTRY_RE = re.compile(
    r"id:\s*'[^']*'[\s\S]*?title:\s*'([^']*)'[\s\S]*?tags:\s*\[([^\]]*)\]"
)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout


def parse_ver(v):
    m = VER_RE.search(v)
    return tuple(int(x) for x in m.groups()) if m else None


def timeline_max_versions():
    """解析 data.js，返回 {repo: (major, minor, patch)}，即每站在时间轴里的最高版本。"""
    text = DATA_JS.read_text()
    start = text.index("const cookbookEntries")
    end = text.index("];", start)
    section = text[start:end]
    result = {}
    for title, tags in ENTRY_RE.findall(section):
        zh = tags.split(",")[0].strip().strip("'\"")
        repo = ZH_TO_REPO.get(zh)
        if not repo:
            continue
        v = parse_ver(title)
        if not v:
            continue
        if repo not in result or v > result[repo]:
            result[repo] = v
    return result


def repo_version_commits(repo):
    """遍历仓库 main 所有带版本号 commit，返回 {(major,minor,patch): (full_ver, subject, sha)}，
    每个完整版本号取最新 commit（git log 默认新→旧，第一个遇到即最新）。"""
    out = run(["git", "-C", str(ROOT / repo), "log", "main", "--format=%H%x00%s"])
    commits = {}
    for line in out.splitlines():
        if not line.strip():
            continue
        sha, _, subject = line.partition("\x00")
        m = FULL_RE.search(subject)
        if not m:
            continue
        v = parse_ver(m.group(1))
        if v not in commits:
            commits[v] = (m.group(1), subject, sha)
    return commits


def commit_meta(repo, sha):
    body = run(["git", "-C", str(ROOT / repo), "log", "-1", "--format=%B", sha]).strip()
    date = run(["git", "-C", str(ROOT / repo), "log", "-1",
                "--format=%ad", "--date=short", sha]).strip()
    return body, date


def parse_subject(subject):
    m = re.match(r"^\w+\(v[\d.]+\):\s*(.*)$", subject)
    if m:
        return m.group(1).strip()
    m = re.match(r"^\w+:\s*(.*)$", subject)
    if m:
        return m.group(1).strip()
    return subject.strip()


def category(subject):
    return "架构" if re.search(r"重构|迁移|统一|改造|改名|升级", subject) else "功能"


def body_rest(full_body):
    parts = full_body.split("\n", 1)
    return parts[1].strip() if len(parts) > 1 else ""


def entry_to_js(e):
    title = e["title"].replace("'", "\\'")
    tags = ", ".join(f"'{t}'" for t in e["tags"])
    body = e["body"].replace("`", "\\`").replace("${", "\\${")
    return (
        "  {\n"
        f"    id: '{e['id']}',\n"
        f"    title: '{title}',\n"
        f"    date: '{e['date']}',\n"
        f"    tags: [{tags}],\n"
        f"    body: `{body}`,\n"
        "  }"
    )


def find_array(text):
    """返回 cookbookEntries 数组的 [起始'['索引, 结束']'索引]。"""
    start = text.index("const cookbookEntries = [") + len("const cookbookEntries = ")
    i = text.index("[", start)
    depth = 0
    in_str = None
    j = i
    while j < len(text):
        c = text[j]
        if in_str:
            if c == "\\":
                j += 2
                continue
            if c == in_str:
                in_str = None
            j += 1
            continue
        if c in ('"', "'", "`"):
            in_str = c
            j += 1
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return i, j
        j += 1
    raise RuntimeError("未找到 cookbookEntries 数组结束")


def timeline_all_versions():
    """解析 data.js，返回 {repo: set of (major, minor, patch)}，即每站在时间轴里的所有版本。"""
    text = DATA_JS.read_text()
    start = text.index("const cookbookEntries")
    end = text.index("];", start)
    section = text[start:end]
    result = {}
    for title, tags in ENTRY_RE.findall(section):
        zh = tags.split(",")[0].strip().strip("'\"")
        repo = ZH_TO_REPO.get(zh)
        if not repo:
            continue
        v = parse_ver(title)
        if not v:
            continue
        if repo not in result:
            result[repo] = set()
        result[repo].add(v)
    return result


def collect_additions():
    """对比时间轴与各仓库所有版本，返回 (additions, notes, new_sites)。"""
    tl_all = timeline_all_versions()
    tl_max = timeline_max_versions()
    additions = []
    notes = []
    new_sites = []
    for repo, zh in SITES.items():
        commits = repo_version_commits(repo)
        if not commits:
            continue
        existing = tl_all.get(repo, set())

        if not existing:
            newest = max(commits)
            notes.append(f"  {repo} ({zh}) → 时间轴无记录（仓库最新 v{newest[0]}.{newest[1]}.{newest[2]}）")
            new_sites.append({"repo": repo, "zh": zh})
            continue

        all_vs = sorted(commits.keys())
        tmin = min(existing)
        all_vs = [v for v in all_vs if v >= tmin]
        gaps = [v for v in all_vs if v not in existing]

        if not gaps:
            continue

        prev_sha = ""
        tmax = tl_max.get(repo)
        if tmax and tmax in commits:
            prev_sha = commits[tmax][2]
        else:
            lower = [v for v in commits if v < gaps[0]]
            if lower:
                prev_sha = commits[max(lower)][2]

        for v in gaps:
            full_ver, subject, sha = commits[v]
            body_text, date = commit_meta(repo, sha)
            matter = parse_subject(subject)
            rest = body_rest(body_text) or f"{zh}升级到 {full_ver}：{matter}。"
            old_sha = prev_sha or ""
            if old_sha:
                stat_out = run(["git", "-C", str(ROOT / repo), "diff", "--shortstat", old_sha, sha]).strip()
                fm = re.search(r'(\d+) file', stat_out)
                im = re.search(r'(\d+) insertion', stat_out)
                dm = re.search(r'(\d+) deletion', stat_out)
                file_stats = {
                    "files_changed": int(fm.group(1)) if fm else 0,
                    "insertions": int(im.group(1)) if im else 0,
                    "deletions": int(dm.group(1)) if dm else 0,
                }
            else:
                file_stats = {"files_changed": 0, "insertions": 0, "deletions": 0}
            additions.append({
                "repo": repo, "zh": zh, "full_ver": full_ver,
                "major_minor": list(v), "sha": sha, "old_sha": old_sha,
                "date": date, "subject": subject, "matter": matter,
                "id": f"{repo}-v{full_ver[1:].replace('.', '')}",
                "title": f"{zh} {full_ver}：{matter}",
                "tags": [zh, category(subject)],
                "body": rest,
                "file_stats": file_stats,
            })
            notes.append(f"  {repo} ({zh}) → 版本缺口 {full_ver} → 将新增")
            prev_sha = sha
    return additions, notes, new_sites


def output_json(additions, new_sites):
    result = {
        "gaps": [{
            k: v for k, v in a.items()
            if k in ("repo", "zh", "full_ver", "major_minor", "sha", "old_sha",
                     "date", "subject", "matter", "id", "title", "tags", "body", "file_stats")
        } for a in additions],
        "new_sites": new_sites,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


def print_status():
    tl = timeline_max_versions()
    print("站点        时间轴最高      仓库最新")
    print("-" * 44)
    for repo, zh in SITES.items():
        commits = repo_version_commits(repo)
        tmax = tl.get(repo)
        tmax_s = f"v{tmax[0]}.{tmax[1]}.{tmax[2]}" if tmax else "（无）"
        newest_s = f"v{max(commits)[0]}.{max(commits)[1]}.{max(commits)[2]}" if commits else "（无）"
        flag = ""
        if commits and (tmax is None or max(commits) > tmax):
            flag = "  ← 有缺口"
        print(f"{repo:<10} {tmax_s:<14} {newest_s}{flag}")


def main():
    if "--status" in sys.argv:
        print_status()
        return
    json_mode = "--json" in sys.argv
    dry_run = "--dry-run" in sys.argv
    additions, notes, new_sites = collect_additions()

    if json_mode:
        output_json(additions, new_sites)
        return

    for n in notes:
        print(n)
    if not additions:
        print("\n无新增记录（时间轴已与各仓库大版本对齐）。")
        return
    if dry_run:
        print("\n[dry-run] 将写入以下记录，未修改文件：\n")
        for e in additions:
            print(entry_to_js(e))
            print()
        return
    text = DATA_JS.read_text()
    i, j = find_array(text)
    inner = text[i + 1:j].rstrip()
    if inner.endswith(","):           # 源数组末元素可能带尾逗号，去掉避免 },, 双逗号
        inner = inner[:-1].rstrip()
    block = ",\n".join(entry_to_js(e) for e in additions)
    if inner.strip() == "":
        new_array = "[\n" + block + "\n]"
    else:
        new_array = "[" + inner + ",\n" + block + "\n]"
    DATA_JS.write_text(text[:i] + new_array + text[j + 1:])
    print(f"\n已新增 {len(additions)} 条记录到 {DATA_JS.relative_to(ROOT)}（未 commit / 未 push）。")


if __name__ == "__main__":
    main()
