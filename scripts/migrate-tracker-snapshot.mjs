import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLongTermState } from '../src/data/tracker-config.js';

const snapshotPath = fileURLToPath(new URL('../public/data/tracker-snapshot.json', import.meta.url));
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
const nextSnapshot = {
  ...snapshot,
  longTerm: normalizeLongTermState(snapshot.longTerm, snapshot.startedOn),
};

if (JSON.stringify(snapshot) === JSON.stringify(nextSnapshot)) {
  console.log('追踪快照已经与当前目标配置一致。');
} else {
  writeFileSync(snapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8');
  console.log('已按当前目标配置迁移追踪快照。');
}
