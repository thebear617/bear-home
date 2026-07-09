#!/usr/bin/env python3
"""Parse _diary/*.md → js/diary-data.js + js/expense-data.js"""
import re, os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DIARY_DIR = ROOT / '_diary'
DIARY_OUT = ROOT / 'js' / 'diary-data.js'
EXPENSE_OUT = ROOT / 'js' / 'expense-data.js'

records = {}
expenses = []
seen = set()

for fname in sorted(os.listdir(DIARY_DIR)):
    if not fname.endswith('.md'):
        continue
    date = fname.replace('.md', '')
    with open(DIARY_DIR / fname, encoding='utf-8') as f:
        content = f.read()

    # ---- Day planner → diaryRecords ----
    m = re.search(r'# Day planner\n(.*?)(?=\n# )', content, re.DOTALL)
    if m:
        planner = m.group(1)
        tasks = []
        for line in planner.strip().split('\n'):
            match = re.match(r'- \[(.)\] #task (\d{2}:\d{2}) - (\d{2}:\d{2}) (.+?) \⏳', line)
            if match:
                status = match.group(1)
                time = f'{match.group(2)}-{match.group(3)}'
                desc = match.group(4).strip()
                tasks.append({'status': status, 'time': time, 'desc': desc})

        if tasks:
            done_count = sum(1 for t in tasks if t['status'] == 'x')
            records[date] = {'value': done_count, 'tasks': tasks}

    # ---- # 支出 table → expenseRecords ----
    me = re.search(r'# 支出\n(.*?)(?=\n# |\Z)', content, re.DOTALL)
    if me:
        table = me.group(1)
        for line in table.strip().split('\n'):
            line = line.strip()
            if not line.startswith('|'):
                continue
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) < 5:
                continue
            # skip header row
            if cells[0] == '时间':
                continue
            # skip separator row (|---|---|...)
            if set(cells[1]) <= set('-: '):
                continue
            cat = cells[1]
            sub = cells[2]
            amt_raw = cells[3].replace('*', '').replace('¥', '').replace(',', '').strip()
            note = cells[4].replace('*', '').strip()
            # skip 当日合计 / empty category
            if not cat or '合计' in cat:
                continue
            try:
                amount = float(amt_raw)
            except ValueError:
                continue
            key = (date, cat, sub, amount, note)
            if key in seen:
                continue
            seen.add(key)
            expenses.append({
                'date': date,
                'cat': cat,
                'sub': sub,
                'amount': amount,
                'note': note,
            })

with open(DIARY_OUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('const diaryRecords = ')
    json.dump(records, f, ensure_ascii=False, indent=2)
    f.write(';\n')

with open(EXPENSE_OUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('const expenseRecords = ')
    json.dump(expenses, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f'Wrote {len(records)} days and {len(expenses)} expenses to {DIARY_OUT} / {EXPENSE_OUT}')
