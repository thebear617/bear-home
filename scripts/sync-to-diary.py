#!/usr/bin/env python3
"""Sync diary-data.js + data.js → _diary/*.md (append only)

Usage:
  python3 scripts/sync-to-diary.py          # sync new records
  python3 scripts/sync-to-diary.py --init   # seed state from current data, no writes
"""
import re, os, json, ast, sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
DIARY_DIR = ROOT / '_diary'
STATE_FILE = ROOT / '.sync-state.json'
DIARY_DATA = ROOT / 'js' / 'diary-data.js'
DATA_JS = ROOT / 'js' / 'data.js'


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE, encoding='utf-8') as f:
            return json.load(f)
    return {'tasks': {}, 'expenses': {}}


def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def parse_diary_records():
    with open(DIARY_DATA, encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'^//.*$', '', content, flags=re.MULTILINE)
    m = re.search(r'const\s+diaryRecords\s*=\s*(\{.*\})\s*;?', content, re.DOTALL)
    if not m:
        return {}
    return json.loads(m.group(1))


def parse_expense_records():
    with open(DATA_JS, encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'const\s+expenseRecords\s*=\s*\[(.*?)\]\s*;', content, re.DOTALL)
    if not m:
        return []
    js_str = m.group(1).strip()
    if not js_str:
        return []
    js_str = re.sub(r'(\w+)\s*:', r'"\1":', js_str)
    try:
        return ast.literal_eval(f'[{js_str}]')
    except (SyntaxError, ValueError) as e:
        print(f'Warning: could not parse expenseRecords: {e}')
        return []


def format_time(time_str):
    """Convert HH:MM-HH:MM to HH:MM - HH:MM"""
    m = re.match(r'(\d{2}:\d{2})-(\d{2}:\d{2})', time_str)
    if m:
        return f'{m.group(1)} - {m.group(2)}'
    return time_str


def ensure_diary_file(date_str):
    diary_path = DIARY_DIR / f'{date_str}.md'
    if diary_path.exists():
        return diary_path

    template_path = Path(os.path.expanduser('~/Documents/notes/Templates/日记模版.md'))
    if template_path.exists():
        with open(template_path, encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'- \[x\] #task.*具体动作.*\n\n', '', content)
        content = re.sub(r'^\| MM-DD.*\n', '', content, flags=re.MULTILINE)
        content = content.replace('YYYY-MM-DD', date_str)
    else:
        content = f"""# Day planner

# 支出

| 时间 | 分类 | 子项 | 金额(¥) | 备注 |
|---|---|---|---|---|
| **当日合计** |  |  | **0.00** |  |

# Notes

> [!example]- 大类 / 子主题: 开发型笔记标题 · MM-DD HH:mm - HH:mm
>
> **会话索引**：`claude --resume "会话名称"` 可继续原上下文维护迭代。
>
> 正文内容

> [!note]- 大类 / 子主题: 普通笔记标题 · MM-DD HH:mm - HH:mm
> 笔记正文

# 完成记录

> [!done]- 大类 / 子主题: 完成事项 · MM-DD HH:mm - HH:mm
> 完成摘要

# 归档记录

> [!done]- YYYY-MM-DD 归档记录
> | 内容 | 归档位置 |
> |---|---|
> | 事项描述 | 目标文件 |
"""

    with open(diary_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return diary_path


def read_diary(date_str):
    diary_path = DIARY_DIR / f'{date_str}.md'
    if not diary_path.exists():
        return None
    with open(diary_path, encoding='utf-8') as f:
        return f.read()


def write_diary(date_str, content):
    diary_path = DIARY_DIR / f'{date_str}.md'
    with open(diary_path, 'w', encoding='utf-8') as f:
        f.write(content)


def find_section_boundaries(content, heading):
    pattern = re.compile(r'^(# .+)$', re.MULTILINE)
    matches = list(pattern.finditer(content))
    for i, m in enumerate(matches):
        if m.group(1).strip() == heading:
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
            return start, end
    return None, None


def sync_tasks(diary_records, state):
    synced = 0
    for date_str, record in sorted(diary_records.items()):
        tasks = record.get('tasks', [])
        if not tasks:
            continue

        synced_times = set(state['tasks'].get(date_str, []))
        new_tasks = [t for t in tasks if t.get('time', '') not in synced_times]
        if not new_tasks:
            continue

        ensure_diary_file(date_str)
        content = read_diary(date_str)
        if content is None:
            continue

        start, end = find_section_boundaries(content, '# Day planner')
        if start is None:
            content = '# Day planner\n\n' + content
            start = len('# Day planner\n\n')
            end = len(content)

        section = content[start:end]
        lines = section.split('\n')

        insert_idx = len(lines)
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip().startswith('- ['):
                insert_idx = i + 1
                break

        new_lines = []
        for task in new_tasks:
            status = task.get('status', 'x')
            time_str = format_time(task.get('time', ''))
            desc = task.get('desc', '')
            new_lines.append(f'- [{status}] #task {time_str} {desc} ⏳ {date_str}')

        for j, line in enumerate(new_lines):
            lines.insert(insert_idx + j, line)

        new_section = '\n'.join(lines)
        new_section = '\n\n' + new_section.lstrip('\n')
        new_section = new_section.rstrip('\n') + '\n'
        content = content[:start] + new_section + '\n' + content[end:]
        write_diary(date_str, content)

        if date_str not in state['tasks']:
            state['tasks'][date_str] = []
        for task in new_tasks:
            state['tasks'][date_str].append(task.get('time', ''))
        synced += len(new_tasks)

    return synced


def sync_expenses(expense_records, state):
    synced = 0
    by_date = {}
    for exp in expense_records:
        date_str = exp.get('date', '')
        if date_str not in by_date:
            by_date[date_str] = []
        by_date[date_str].append(exp)

    for date_str, expenses in sorted(by_date.items()):
        synced_keys = set(state['expenses'].get(date_str, []))
        new_expenses = []
        for exp in expenses:
            key = f"{exp.get('sub', '')}_{exp.get('amount', 0)}"
            if key not in synced_keys:
                new_expenses.append(exp)
        if not new_expenses:
            continue

        ensure_diary_file(date_str)
        content = read_diary(date_str)
        if content is None:
            continue

        start, end = find_section_boundaries(content, '# 支出')
        if start is None:
            dp_start, dp_end = find_section_boundaries(content, '# Day planner')
            insert_pos = dp_end if dp_end is not None else 0
            expense_block = """# 支出

| 时间 | 分类 | 子项 | 金额(¥) | 备注 |
|---|---|---|---|---|
| **当日合计** |  |  | **0.00** |  |

"""
            content = content[:insert_pos].rstrip('\n') + '\n\n' + expense_block + content[insert_pos:]
            start, end = find_section_boundaries(content, '# 支出')

        section = content[start:end]
        total_match = re.search(r'^\|\s*\*\*当日合计\*\*.*$', section, re.MULTILINE)

        new_rows = []
        for exp in new_expenses:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            time_str = date_obj.strftime('%m-%d')
            cat = exp.get('cat', '')
            sub = exp.get('sub', '')
            amount = exp.get('amount', 0)
            note = exp.get('note', '')
            new_rows.append(f'| {time_str} | {cat} | {sub} | {amount:.2f} | {note} |')

        if total_match:
            insert_pos = start + total_match.start()
            content = content[:insert_pos] + '\n'.join(new_rows) + '\n' + content[insert_pos:]
        else:
            content = content[:end] + '\n'.join(new_rows) + '\n' + content[end:]

        start_new, end_new = find_section_boundaries(content, '# 支出')
        section_new = content[start_new:end_new]
        total = 0.0
        for m in re.finditer(r'^\|[^*].*?\|[^*].*?\|[^*].*?\|\s*([\d.]+)\s*\|', section_new, re.MULTILINE):
            try:
                total += float(m.group(1))
            except ValueError:
                pass

        content = re.sub(
            r'\|\s*\*\*当日合计\*\*\s*\|\s*\|\s*\|\s*\*\*[\d.]+\*\*\s*\|',
            f'| **当日合计** |  |  | **{total:.2f}** |',
            content
        )

        write_diary(date_str, content)

        if date_str not in state['expenses']:
            state['expenses'][date_str] = []
        for exp in new_expenses:
            key = f"{exp.get('sub', '')}_{exp.get('amount', 0)}"
            state['expenses'][date_str].append(key)
        synced += len(new_expenses)

    return synced


def init_state():
    """Seed sync state from current diary-data.js + data.js without writing to .md"""
    state = {'tasks': {}, 'expenses': {}}

    diary_records = parse_diary_records()
    for date_str, record in diary_records.items():
        tasks = record.get('tasks', [])
        if tasks:
            state['tasks'][date_str] = [t.get('time', '') for t in tasks]

    expense_records = parse_expense_records()
    for exp in expense_records:
        date_str = exp.get('date', '')
        key = f"{exp.get('sub', '')}_{exp.get('amount', 0)}"
        if date_str not in state['expenses']:
            state['expenses'][date_str] = []
        state['expenses'][date_str].append(key)

    save_state(state)
    task_count = sum(len(v) for v in state['tasks'].values())
    expense_count = sum(len(v) for v in state['expenses'].values())
    print(f'Initialized state: {task_count} tasks, {expense_count} expenses (no files written)')


def main():
    if '--init' in sys.argv:
        init_state()
        return

    state = load_state()
    diary_records = parse_diary_records()
    expense_records = parse_expense_records()
    task_synced = sync_tasks(diary_records, state)
    expense_synced = sync_expenses(expense_records, state)
    save_state(state)
    print(f'Synced {task_synced} tasks and {expense_synced} expenses to _diary/')


if __name__ == '__main__':
    main()
