import { defineConfig } from 'astro/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLongTermState } from './src/data/tracker-config.js';

const trackerSnapshotPath = fileURLToPath(new URL('./public/data/tracker-snapshot.json', import.meta.url));
const todoStatePath = fileURLToPath(new URL('./src/data/todo-state.json', import.meta.url));
const todoDataPath = fileURLToPath(new URL('./src/data/todo-data.ts', import.meta.url));
const archivedTodoDataPath = fileURLToPath(new URL('./src/data/archived-todo-data.ts', import.meta.url));

// 看板「新增 / 删除任务」直接写回 todo-data.ts。看板 id → 任务 id 前缀。
const TODO_FILE_BOARD_PREFIXES = { life: 'l', coding: 'c', research: 'r' };

const TODO_STATUSES = ['todo', 'doing', 'done'];

function isValidDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toUtcDate(dateKey) {
  if (!isValidDateKey(dateKey)) return null;
  const date = new Date(dateKey + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function diffDays(start, end) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function normalizePhaseStatus(value) {
  return TODO_STATUSES.includes(value) ? value : 'todo';
}

// 与 src/scripts/todo-board.ts 的 normalizePhases 保持同一套语义：
// 阶段严格连续、无缝铺满计划区间，首阶段对齐 plannedStart，末阶段收在 plannedEnd。
function normalizePhases(plannedStart, plannedEnd, phases) {
  const start = toUtcDate(plannedStart);
  const end = toUtcDate(plannedEnd);
  if (!start || !end || diffDays(start, end) < 0) return undefined;
  if (!Array.isArray(phases) || phases.length === 0) return undefined;

  const cleaned = phases.filter((phase) => phase && typeof phase.id === 'string');
  if (cleaned.length === 0) return undefined;

  if (diffDays(start, end) === 0) {
    const only = cleaned[0];
    return [{
      id: only.id,
      title: (only.title || '阶段 1').trim() || '阶段 1',
      start: formatDateKey(start),
      end: formatDateKey(end),
      status: normalizePhaseStatus(only.status),
    }];
  }

  const ordered = cleaned.every((phase) => isValidDateKey(phase.start))
    ? [...cleaned].sort((a, b) => a.start.localeCompare(b.start))
    : cleaned;

  const result = [];
  let cursor = new Date(start);
  const lastIndex = ordered.length - 1;
  for (let index = 0; index < ordered.length; index += 1) {
    // 可用天数已经分完时直接截断，避免产生 start 晚于 end 的畸形阶段。
    if (cursor > end) break;
    const phase = ordered[index];
    const isLast = index === lastIndex || formatDateKey(cursor) === formatDateKey(end);
    let phaseEnd = isLast ? new Date(end) : toUtcDate(phase.end);
    if (!phaseEnd || phaseEnd < cursor) phaseEnd = new Date(cursor);
    if (phaseEnd > end) phaseEnd = new Date(end);
    result.push({
      id: phase.id,
      title: (phase.title || '').trim() || '未命名阶段',
      start: formatDateKey(cursor),
      end: formatDateKey(phaseEnd),
      status: normalizePhaseStatus(phase.status),
    });
    cursor = addDays(phaseEnd, 1);
  }
  const tail = result[result.length - 1];
  if (tail && tail.end < formatDateKey(end)) tail.end = formatDateKey(end);
  return result;
}

function normalizeTodoPatch(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid todo patch');
  }
  const patch = {};
  if (raw.status !== undefined) {
    if (!TODO_STATUSES.includes(raw.status)) throw new Error('invalid todo status');
    patch.status = raw.status;
  }
  for (const key of ['plannedStart', 'plannedEnd', 'completedAt']) {
    if (raw[key] !== undefined) {
      if (!isValidDateKey(raw[key])) throw new Error(`invalid todo ${key}`);
      patch[key] = raw[key];
    }
  }
  // 空数组表示清除阶段：不写入 patch，配合下方整体替换即可移除旧阶段。
  if (raw.phases !== undefined && Array.isArray(raw.phases) && raw.phases.length > 0) {
    for (const phase of raw.phases) {
      if (!phase || typeof phase !== 'object' || Array.isArray(phase)) throw new Error('invalid todo phase');
      if (typeof phase.id !== 'string' || !phase.id) throw new Error('invalid todo phase id');
      if (typeof phase.title !== 'string') throw new Error('invalid todo phase title');
      if (phase.status !== undefined && !TODO_STATUSES.includes(phase.status)) throw new Error('invalid todo phase status');
      for (const key of ['start', 'end']) {
        if (phase[key] !== undefined && !isValidDateKey(phase[key])) throw new Error(`invalid todo phase ${key}`);
      }
    }
    patch.phases = raw.phases;
  }
  return patch;
}

// 「新增任务」弹窗的落盘：往 todo-data.ts 对应看板的 items 数组头部插入一行。
// 字符串一律走 JSON.stringify（双引号 + 转义），保证引号 / 换行都不会破坏单行格式。
// id 取活跃 + 归档两个文件的全局最大值递增：归档任务与新任务共用 l/c/r 前缀，
// 只扫活跃文件会发出与归档冲突的 id（v0.30.0 验收时 l33 撞号事故的根因）。
function nextTodoItemId(sources, boardId) {
  const prefix = TODO_FILE_BOARD_PREFIXES[boardId];
  if (!prefix) throw new Error(`unknown board: ${boardId}`);
  let max = 0;
  for (const source of sources) {
    for (const match of source.matchAll(new RegExp("id: '" + prefix + "(\\d+)'", 'g'))) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return prefix + (max + 1);
}

function addTodoItemToFile(payload) {
  const boardId = payload?.boardId;
  if (typeof boardId !== 'string' || !TODO_FILE_BOARD_PREFIXES[boardId]) throw new Error('invalid board');
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) throw new Error('invalid title');
  if (!isValidDateKey(payload.date)) throw new Error('invalid date');
  const url = typeof payload.url === 'string' ? payload.url.trim() : '';
  const note = typeof payload.note === 'string' ? payload.note.trim() : '';
  const createdAt = isValidDateKey(payload.createdAt) ? payload.createdAt : formatDateKey(new Date());

  if (!existsSync(todoDataPath)) throw new Error('todo-data.ts missing');
  const source = readFileSync(todoDataPath, 'utf8');
  // 归档文件可能不存在（首次使用），缺省按空内容参与 id 扫描。
  const archivedSource = existsSync(archivedTodoDataPath) ? readFileSync(archivedTodoDataPath, 'utf8') : '';
  const lines = source.split('\n');
  const boardIndex = lines.findIndex((line) => new RegExp(`^\\s*id: '${boardId}',$`).test(line));
  if (boardIndex === -1) throw new Error(`board not found: ${boardId}`);
  let itemsIndex = -1;
  let inlineEmpty = false;
  for (let index = boardIndex + 1; index < lines.length; index += 1) {
    if (/^\s*items: \[\s*$/.test(lines[index])) { itemsIndex = index; break; }
    // summary / research 这类空看板的 items 写成一行 `items: []`，插入时展开成多行。
    if (/^\s*items: \[\]\s*,?\s*$/.test(lines[index])) { itemsIndex = index; inlineEmpty = true; break; }
    // 已经走出这个看板的块还没找到 items，说明该看板没有 items 数组。
    if (/^\s*\},?\s*$/.test(lines[index])) break;
  }
  if (itemsIndex === -1) throw new Error(`items array not found for board: ${boardId}`);
  const id = nextTodoItemId([source, archivedSource], boardId);
  const itemLine = `      { id: '${id}', title: ${JSON.stringify(title)}, status: 'todo', date: '${payload.date}', createdAt: '${createdAt}', url: ${JSON.stringify(url)}, note: ${JSON.stringify(note)} },`;
  if (inlineEmpty) {
    lines.splice(itemsIndex, 1, '    items: [', itemLine, '    ]');
  } else {
    lines.splice(itemsIndex + 1, 0, itemLine);
  }
  writeFileSync(todoDataPath, lines.join('\n'), 'utf8');
  lastSelfWriteAt = Date.now();
  return { id, title, status: 'todo', date: payload.date, createdAt, url, note, boardId };
}

function removeTodoItemFromFile(id) {
  if (typeof id !== 'string' || !/^[a-z]\d+$/i.test(id)) throw new Error('invalid id');
  const source = readFileSync(todoDataPath, 'utf8');
  const lines = source.split('\n');
  const itemPattern = new RegExp("^\\s*\\{ id: '" + id + "',");
  const index = lines.findIndex((line) => itemPattern.test(line));
  if (index === -1) return { found: false };
  lines.splice(index, 1);
  writeFileSync(todoDataPath, lines.join('\n'), 'utf8');
  lastSelfWriteAt = Date.now();
  return { found: true };
}

function mergeTodoItems(currentItems, incomingItems) {
  const merged = { ...(currentItems && typeof currentItems === 'object' ? currentItems : {}) };
  for (const [id, patch] of Object.entries(incomingItems || {})) {
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new Error(`invalid todo id: ${id}`);
    const normalized = normalizeTodoPatch(patch);
    if (Object.keys(normalized).length === 0) {
      delete merged[id];
      continue;
    }
    // 阶段依附于计划区间，拿到完整区间后再归一化，保证落盘的数据一定连续无缝。
    const plannedStart = normalized.plannedStart ?? currentItems?.[id]?.plannedStart;
    const plannedEnd = normalized.plannedEnd ?? currentItems?.[id]?.plannedEnd;
    const phases = normalizePhases(plannedStart, plannedEnd, normalized.phases);
    if (phases) normalized.phases = phases;
    else delete normalized.phases;
    merged[id] = normalized;
  }
  return merged;
}

function earliestDateKey(...values) {
  return values
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value || ''))
    .sort()[0] || values.find(Boolean);
}

function mergeDailyRecords(currentRecords, incomingRecords) {
  return {
    ...(currentRecords && typeof currentRecords === 'object' ? currentRecords : {}),
    ...(incomingRecords && typeof incomingRecords === 'object' ? incomingRecords : {}),
  };
}

function mergeLongTermGoals(currentGoals, incomingGoals) {
  const merged = new Map();
  for (const goal of Array.isArray(currentGoals) ? currentGoals : []) {
    if (goal?.id) merged.set(goal.id, goal);
  }
  for (const goal of Array.isArray(incomingGoals) ? incomingGoals : []) {
    if (!goal?.id) continue;
    const previous = merged.get(goal.id);
    merged.set(goal.id, {
      ...previous,
      ...goal,
      startedAt: earliestDateKey(previous?.startedAt, goal.startedAt),
    });
  }
  return [...merged.values()];
}

// 自写入数据文件会触发 dev server 的内容变更广播，整页刷新会丢失看板视图等内存态
// （例如甘特图视图被重置回看板）。借鉴 lifenotes/devnotes 本地 CMS 的做法：
// 自写入后的短暂窗口内吞掉 full-reload / update 广播，页面内存态本就是最新的，无需刷新。
const SELF_WRITE_SUPPRESS_WINDOW_MS = 2500;
let lastSelfWriteAt = 0;
let reloadSuppressInstalled = false;

function suppressSelfWriteReload(server) {
  if (reloadSuppressInstalled) return;
  reloadSuppressInstalled = true;
  const hot = server.hot || server.ws;
  if (!hot) return;
  const originalSend = hot.send.bind(hot);
  hot.send = (...args) => {
    const payload = typeof args[0] === 'string' ? { type: args[0] } : (args[0] || {});
    if ((payload.type === 'full-reload' || payload.type === 'update') && Date.now() - lastSelfWriteAt < SELF_WRITE_SUPPRESS_WINDOW_MS) {
      console.log('[self-sync] swallowed ' + payload.type + ' broadcast caused by self write');
      return;
    }
    return originalSend(...args);
  };
}

function todoSyncPlugin() {
  return {
    name: 'todo-sync',
    configureServer(server) {
      suppressSelfWriteReload(server);
      server.middlewares.use('/__todo_file', (request, response, next) => {
        // 「新增 / 删除任务」按钮：直接写回 src/data/todo-data.ts（仅本地 dev）。
        if (request.method !== 'POST') {
          next();
          return;
        }
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (payload?.action === 'add') {
              const item = addTodoItemToFile(payload);
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ ok: true, item }));
              return;
            }
            if (payload?.action === 'remove') {
              const result = removeTodoItemFromFile(payload.id);
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ ok: true, ...result }));
              return;
            }
            throw new Error('unknown action');
          } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request' }));
          }
        });
      });
      server.middlewares.use('/__todo_sync', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (payload?.schemaVersion !== 1 || !payload?.items || typeof payload.items !== 'object' || Array.isArray(payload.items)) {
              throw new Error('invalid todo state');
            }

            let currentState = null;
            if (existsSync(todoStatePath)) {
              try { currentState = JSON.parse(readFileSync(todoStatePath, 'utf8')); } catch { currentState = null; }
            }

            const nextItems = mergeTodoItems(currentState?.items, payload.items);
            const nextSnapshot = {
              version: 1,
              updatedAt: payload.updatedAt || new Date().toISOString(),
              items: nextItems,
            };

            const currentData = JSON.stringify(currentState?.items || {});
            const nextData = JSON.stringify(nextItems);
            if (currentState?.version === 1 && currentData === nextData) {
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ changed: false, updatedAt: currentState.updatedAt }));
              return;
            }

            mkdirSync(dirname(todoStatePath), { recursive: true });
            writeFileSync(todoStatePath, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8');
            lastSelfWriteAt = Date.now();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ changed: true, updatedAt: nextSnapshot.updatedAt }));
          } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request' }));
          }
        });
      });
    }
  };
}

function trackerSyncPlugin() {
  return {
    name: 'tracker-sync',
    configureServer(server) {
      suppressSelfWriteReload(server);
      server.middlewares.use('/__tracker_sync', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (payload?.schemaVersion !== 1 || !payload?.startedOn || !payload?.dailyRecords || typeof payload.dailyRecords !== 'object') {
              throw new Error('invalid tracker snapshot');
            }

            let currentSnapshot = null;
            if (existsSync(trackerSnapshotPath)) {
              try { currentSnapshot = JSON.parse(readFileSync(trackerSnapshotPath, 'utf8')); } catch { currentSnapshot = null; }
            }

            const mergedStartedOn = earliestDateKey(currentSnapshot?.startedOn, payload.startedOn);
            const nextSnapshot = {
              schemaVersion: 1,
              snapshotAt: payload.snapshotAt || new Date().toISOString(),
              startedOn: mergedStartedOn,
              dailyRecords: mergeDailyRecords(currentSnapshot?.dailyRecords, payload.dailyRecords),
              longTerm: normalizeLongTermState({
                ...(currentSnapshot?.longTerm || {}),
                ...(payload.longTerm || {}),
                goals: mergeLongTermGoals(currentSnapshot?.longTerm?.goals, payload.longTerm?.goals),
              }, mergedStartedOn)
            };

            const currentData = JSON.stringify({ dailyRecords: currentSnapshot?.dailyRecords || {}, longTerm: currentSnapshot?.longTerm || { goals: [] } });
            const nextData = JSON.stringify({ dailyRecords: nextSnapshot.dailyRecords, longTerm: nextSnapshot.longTerm });
            if (currentSnapshot?.schemaVersion === 1 && currentData === nextData) {
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ changed: false, snapshotAt: currentSnapshot.snapshotAt }));
              return;
            }

            mkdirSync(dirname(trackerSnapshotPath), { recursive: true });
            writeFileSync(trackerSnapshotPath, `${JSON.stringify(nextSnapshot, null, 2)}\n`, 'utf8');
            lastSelfWriteAt = Date.now();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ changed: true, snapshotAt: nextSnapshot.snapshotAt }));
          } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  output: 'static',
  vite: {
    plugins: [todoSyncPlugin(), trackerSyncPlugin()],
    server: { strictPort: true }
  },
  build: {
    format: 'directory'
  }
});
