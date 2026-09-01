import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const statePath = fileURLToPath(new URL('../src/data/todo-state.json', import.meta.url));
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const errors = [];

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses = ['todo', 'doing', 'done'];

function toUtcDate(dateKey) {
  if (typeof dateKey !== 'string' || !dateKeyPattern.test(dateKey)) return null;
  const date = new Date(dateKey + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(start, end) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function nextDay(dateKey) {
  const date = toUtcDate(dateKey);
  if (!date) return null;
  date.setDate(date.getDate() + 1);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

if (state.version !== 1 || !state.items || typeof state.items !== 'object' || Array.isArray(state.items)) {
  errors.push('顶层结构不完整：需要 { version: 1, items: {...} }');
} else {

  for (const [id, patch] of Object.entries(state.items)) {
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
      errors.push(`非法任务 id：${id}`);
      continue;
    }
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      errors.push(`${id} 的补丁不是对象`);
      continue;
    }
    for (const key of ['plannedStart', 'plannedEnd', 'completedAt']) {
      const value = patch[key];
      if (value !== undefined && (typeof value !== 'string' || !dateKeyPattern.test(value))) {
        errors.push(`${id} 的 ${key} 不是 YYYY-MM-DD 日期`);
      }
    }
    if (patch.status !== undefined && !statuses.includes(patch.status)) {
      errors.push(`${id} 的 status 为 ${patch.status}，仅允许 todo/doing/done`);
    }
    if (patch.phases === undefined) continue;

    const phases = patch.phases;
    if (!Array.isArray(phases) || phases.length === 0) {
      errors.push(`${id} 的 phases 必须是非空数组（不需要阶段时应删除该字段）`);
      continue;
    }
    if (!patch.plannedStart || !patch.plannedEnd) {
      errors.push(`${id} 有阶段但缺少 plannedStart / plannedEnd`);
      continue;
    }
    let previousEnd = null;
    let broken = false;
    phases.forEach((phase, index) => {
      if (!phase || typeof phase !== 'object' || Array.isArray(phase)) {
        errors.push(`${id} 第 ${index + 1} 个阶段不是对象`);
        broken = true;
        return;
      }
      if (typeof phase.id !== 'string' || !phase.id) {
        errors.push(`${id} 第 ${index + 1} 个阶段缺少 id`);
        broken = true;
      }
      if (typeof phase.title !== 'string' || !phase.title.trim()) {
        errors.push(`${id} 第 ${index + 1} 个阶段缺少名称`);
        broken = true;
      }
      if (!statuses.includes(phase.status)) {
        errors.push(`${id} 第 ${index + 1} 个阶段 status 为 ${phase.status}，仅允许 todo/doing/done`);
        broken = true;
      }
      for (const key of ['start', 'end']) {
        if (typeof phase[key] !== 'string' || !dateKeyPattern.test(phase[key])) {
          errors.push(`${id} 第 ${index + 1} 个阶段的 ${key} 不是 YYYY-MM-DD 日期`);
          broken = true;
        }
      }
      if (broken) return;
      const start = toUtcDate(phase.start);
      const end = toUtcDate(phase.end);
      if (start && end && diffDays(start, end) < 0) {
        errors.push(`${id} 第 ${index + 1} 个阶段（${phase.title}）开始日期晚于结束日期`);
        broken = true;
        return;
      }
      const expectedStart = index === 0 ? patch.plannedStart : previousEnd && nextDay(previousEnd);
      if (expectedStart && phase.start !== expectedStart) {
        errors.push(`${id} 第 ${index + 1} 个阶段（${phase.title}）应从 ${expectedStart} 开始，实际为 ${phase.start}（阶段之间不能留空档）`);
      }
      previousEnd = phase.end;
    });
    if (broken) continue;
    const tail = phases[phases.length - 1];
    if (tail && tail.end !== patch.plannedEnd) {
      errors.push(`${id} 的末阶段应结束于 ${patch.plannedEnd}，实际为 ${tail.end}`);
    }
  }
}

if (errors.length > 0) {
  console.error('任务看板状态校验失败：');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('任务看板状态校验通过。');
}
