import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { trackerGoalDefinitions } from '../src/data/tracker-config.js';

const snapshotPath = fileURLToPath(new URL('../public/data/tracker-snapshot.json', import.meta.url));
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
const errors = [];

if (snapshot.schemaVersion !== 1 || !snapshot.snapshotAt || !snapshot.startedOn || !snapshot.dailyRecords || typeof snapshot.dailyRecords !== 'object') {
  errors.push('顶层结构不完整');
}

const goals = snapshot.longTerm?.goals;
if (!Array.isArray(goals)) {
  errors.push('longTerm.goals 不存在或不是数组');
} else {
  for (const definition of trackerGoalDefinitions) {
    const goal = goals.find((item) => item?.id === definition.id);
    if (!goal) {
      errors.push(`缺少目标 ${definition.id}`);
      continue;
    }
    if (goal.target !== definition.target) {
      errors.push(`${definition.id} 的 target 为 ${goal.target}，当前配置要求 ${definition.target}`);
    }
  }
}

if (errors.length > 0) {
  console.error('追踪快照校验失败：');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('追踪快照校验通过。');
}
