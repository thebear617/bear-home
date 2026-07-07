#!/usr/bin/env python3
"""Parse _diary/*.md → js/diary-data.js"""
import re, os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DIARY_DIR = ROOT / '_diary'
OUTPUT = ROOT / 'js' / 'diary-data.js'

records = {}

for fname in sorted(os.listdir(DIARY_DIR)):
    if not fname.endswith('.md'):
        continue
    date = fname.replace('.md', '')
    with open(DIARY_DIR / fname, encoding='utf-8') as f:
        content = f.read()

    m = re.search(r'# Day planner\n(.*?)(?=\n# )', content, re.DOTALL)
    if not m:
        continue

    planner = m.group(1)

    tasks = []
    for line in planner.strip().split('\n'):
        match = re.match(r'- \[(.)\] #task (\d{2}:\d{2}) - (\d{2}:\d{2}) (.+?) \⏳', line)
        if match:
            status = match.group(1)
            time = f'{match.group(2)}-{match.group(3)}'
            desc = match.group(4).strip()
            tasks.append({'status': status, 'time': time, 'desc': desc})

    if not tasks:
        continue

    done_count = sum(1 for t in tasks if t['status'] == 'x')
    records[date] = {'value': done_count, 'tasks': tasks}

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated from _diary/*.md by scripts/build-diary.py\n')
    f.write('const diaryRecords = ')
    json.dump(records, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f'Wrote {len(records)} days to {OUTPUT}')
