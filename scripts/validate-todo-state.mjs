import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const statePath = fileURLToPath(new URL('../src/data/todo-state.json', import.meta.url));
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const errors = [];

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const hourKeyPattern = /^([01]\d|2[0-3]):00$/;
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

function toScheduledDateTime(dateKey, timeKey) {
  if (typeof dateKey !== 'string' || !dateKeyPattern.test(dateKey) || typeof timeKey !== 'string' || !hourKeyPattern.test(timeKey)) return null;
  const value = new Date(dateKey + 'T' + timeKey + ':00');
  return Number.isNaN(value.getTime()) ? null : value;
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
    for (const key of ['plannedStartTime', 'plannedEndTime']) {
      const value = patch[key];
      if (value !== undefined && (typeof value !== 'string' || !hourKeyPattern.test(value))) {
        errors.push(`${id} 的 ${key} 不是整点 HH:00 时间`);
      }
    }
    if ((patch.plannedStartTime === undefined) !== (patch.plannedEndTime === undefined)) {
      errors.push(`${id} 的小时排期必须同时有 plannedStartTime 和 plannedEndTime`);
    } else if (patch.plannedStartTime && patch.plannedEndTime) {
      if (!patch.plannedStart || !patch.plannedEnd) {
        errors.push(`${id} 有小时排期但缺少 plannedStart / plannedEnd`);
      } else {
        const startAt = toScheduledDateTime(patch.plannedStart, patch.plannedStartTime);
        const endAt = toScheduledDateTime(patch.plannedEnd, patch.plannedEndTime);
        if (!startAt || !endAt || endAt <= startAt) errors.push(`${id} 的小时排期结束时间必须晚于开始时间`);
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
    const hourlyPhases = Boolean(patch.plannedStartTime && patch.plannedEndTime);
    const plannedStartAt = hourlyPhases ? toScheduledDateTime(patch.plannedStart, patch.plannedStartTime) : null;
    const plannedEndAt = hourlyPhases ? toScheduledDateTime(patch.plannedEnd, patch.plannedEndTime) : null;
    let previousEnd = null;
    let previousEndAt = null;
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
      if (hourlyPhases) {
        for (const key of ['startTime', 'endTime']) {
          if (typeof phase[key] !== 'string' || !hourKeyPattern.test(phase[key])) {
            errors.push(`${id} 第 ${index + 1} 个阶段的 ${key} 不是整点 HH:00 时间`);
            broken = true;
          }
        }
      } else if (phase.startTime !== undefined || phase.endTime !== undefined) {
        errors.push(`${id} 第 ${index + 1} 个阶段有时间端点，但任务不是小时排期`);
        broken = true;
      }
      if (broken) return;
      if (hourlyPhases) {
        const startAt = toScheduledDateTime(phase.start, phase.startTime);
        const endAt = toScheduledDateTime(phase.end, phase.endTime);
        if (!startAt || !endAt || endAt <= startAt) {
          errors.push(`${id} 第 ${index + 1} 个阶段（${phase.title}）结束时刻必须晚于开始时刻`);
          broken = true;
          return;
        }
        const expectedStartAt = index === 0 ? plannedStartAt : previousEndAt;
        if (expectedStartAt && startAt.getTime() !== expectedStartAt.getTime()) {
          errors.push(`${id} 第 ${index + 1} 个阶段（${phase.title}）未与上一阶段无缝衔接`);
        }
        previousEndAt = endAt;
        return;
      }
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
    if (hourlyPhases && tail && plannedEndAt) {
      const tailEndAt = toScheduledDateTime(tail.end, tail.endTime);
      if (!tailEndAt || tailEndAt.getTime() !== plannedEndAt.getTime()) {
        errors.push(`${id} 的末阶段应结束于计划结束时刻`);
      }
    } else if (tail && tail.end !== patch.plannedEnd) {
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
