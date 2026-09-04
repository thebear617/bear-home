import type { TodoBoard, TodoItem } from '../data/todo-data';

declare global {
  interface Window {
    __TODO_BOARDS?: TodoBoard[];
    __ARCHIVED_TODO_BOARDS?: TodoBoard[];
    __TODO_STATE?: { version: 1; items: Record<string, TodoStatePatch> };
  }
}

interface HeatmapItem {
  title: string;
  url?: string;
  boardName: string;
  boardIcon: string;
}

type BoardItem = TodoItem & {
  sourceBoard?: { id: string; name: string; icon: string };
  phases?: TodoPhase[];
  // 来自 archived-todo-data.ts 的归档条目：不可删除、永远视为已完成。
  archived?: boolean;
};

type TodoPhaseStatus = 'todo' | 'doing' | 'done';

interface TodoPhase {
  id: string;
  title: string;
  start: string;
  end: string;
  // 小时级任务的阶段边界。日期级任务不写这两个字段。
  startTime?: string;
  endTime?: string;
  status: TodoPhaseStatus;
}

type TodoStatePatch = Partial<Pick<TodoItem, 'status' | 'plannedStart' | 'plannedEnd' | 'plannedStartTime' | 'plannedEndTime' | 'completedAt'>> & {
  phases?: TodoPhase[];
};

interface TodoLocalState {
  version: 1;
  items: Record<string, TodoStatePatch>;
}

const SUMMARY_BOARD_IDS = ['life', 'coding', 'research'];
const BOARD_PAGE_SIZE = 4;
const HEATMAP_PAGE_SIZE = 3;
// 旧版 localStorage 补丁的 key。仅用于一次性迁移到仓库状态文件（src/data/todo-state.json）。
const LEGACY_TODO_STORAGE_KEY = 'bear-home.todo-board.v1';

let activeTabId = 'summary';
let currentView: 'board' | 'gantt' = 'board';
let historyOpen = false;
let selectedHeatmapDate: string | null = null;
let heatmapPage = 0;
let scheduleItemId: string | null = null;
let completionItemId: string | null = null;
let phaseItemId: string | null = null;
let newItemOpen = false;
let editItemId: string | null = null;
// 阶段弹窗的编辑草稿。弹窗内所有增删改都先落在草稿上，保存时才写回状态文件。
// 因为 refresh() 会重建整个看板（含弹窗 DOM），必须靠草稿保留用户正在输入的内容。
let phaseDraft: TodoPhase[] | null = null;
let ganttShowCompleted = false;
let ganttGranularity: 'day' | 'hour' = 'day';
const boardPages: Record<string, number> = {};

// 任务状态的唯一真源是仓库里的 src/data/todo-state.json，构建时注入页面。
// 本地 dev 下的修改通过 POST /__todo_sync 写回该文件，push 后随发布构建生效。
function isEditable(): boolean {
  // import.meta.env.DEV 在构建时被静态替换：dev server 下为 true，build 产物中为 false。
  return (import.meta as { env?: { DEV?: boolean } }).env?.DEV !== false;
}

function normalizeTodoState(raw: unknown): { version: 1; items: Record<string, TodoStatePatch> } {
  const items = (raw as { items?: unknown })?.items;
  if (items && typeof items === 'object' && !Array.isArray(items)) {
    return { version: 1, items: items as Record<string, TodoStatePatch> };
  }
  return { version: 1, items: {} };
}

const todoState = normalizeTodoState(window.__TODO_STATE);

let syncing = false;
let syncDirty = false;
let toastTimer: ReturnType<typeof window.setTimeout> | undefined;

function showToast(message: string): void {
  let toast = document.querySelector('.todo-board-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'todo-board-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

async function pushTodoState(): Promise<void> {
  if (!isEditable()) return;
  if (syncing) {
    syncDirty = true;
    return;
  }
  syncing = true;
  try {
    const response = await fetch('/__todo_sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        items: todoState.items,
      }),
    });
    if (!response.ok) throw new Error(String(response.status));
    syncDirty = false;
  } catch {
    syncDirty = true;
    showToast('⚠️ 任务状态保存失败：请确认本地 dev server 正在运行（npm run dev）');
  } finally {
    syncing = false;
    if (syncDirty) pushTodoState();
  }
}

// 阶段名平铺最多 4 个字符（按字符数计，不区分中日/ASCII），超出截断。
// 悬浮窗始终展示完整名字，所以截断不丢信息。
const PHASE_TITLE_MAX = 4;

function truncatePhaseTitle(title: string): string {
  const chars = Array.from(String(title || ''));
  if (chars.length <= PHASE_TITLE_MAX) return title || '';
  return chars.slice(0, PHASE_TITLE_MAX).join('') + '…';
}

function applyTodoState(item: TodoItem, phases?: TodoPhase[]): BoardItem {
  return { ...item, ...(todoState.items[item.id] || {}), phases };
}

function hourKey(date: Date): string {
  return String(date.getHours()).padStart(2, '0') + ':00';
}

function phaseDateTime(phase: TodoPhase, boundary: 'start' | 'end'): Date | null {
  return parseScheduledDateTime(phase[boundary], boundary === 'start' ? phase.startTime : phase.endTime);
}

function isHourlyPhasePlan(plannedStart?: string, plannedEnd?: string, plannedStartTime?: string, plannedEndTime?: string): boolean {
  const start = parseScheduledDateTime(plannedStart, plannedStartTime);
  const end = parseScheduledDateTime(plannedEnd, plannedEndTime);
  return Boolean(start && end && end > start);
}

// 阶段必须严格连续、无缝铺满任务的计划区间。按天任务的阶段端点为闭区间日期；
// 按小时任务的端点为连续整点，后一阶段从前一阶段的结束时刻立即开始。
function normalizePhases(plannedStart?: string, plannedEnd?: string, phases?: TodoPhase[], plannedStartTime?: string, plannedEndTime?: string): TodoPhase[] | undefined {
  const hourlyStart = parseScheduledDateTime(plannedStart, plannedStartTime);
  const hourlyEnd = parseScheduledDateTime(plannedEnd, plannedEndTime);
  const isHourly = Boolean(hourlyStart && hourlyEnd && hourlyEnd > hourlyStart);
  if (isHourly && hourlyStart && hourlyEnd) {
    if (!Array.isArray(phases) || phases.length === 0) return undefined;
    const ordered = phases
      .filter((phase) => phase && typeof phase.id === 'string')
      .sort((a, b) => (phaseDateTime(a, 'start')?.getTime() || 0) - (phaseDateTime(b, 'start')?.getTime() || 0));
    if (ordered.length === 0) return undefined;
    const result: TodoPhase[] = [];
    let cursor = new Date(hourlyStart);
    const lastIndex = ordered.length - 1;
    for (let index = 0; index < ordered.length; index += 1) {
      if (cursor >= hourlyEnd) break;
      const phase = ordered[index];
      const isLast = index === lastIndex;
      let phaseEnd = isLast ? new Date(hourlyEnd) : phaseDateTime(phase, 'end');
      if (!phaseEnd || phaseEnd <= cursor) phaseEnd = addHours(cursor, 1);
      if (phaseEnd > hourlyEnd) phaseEnd = new Date(hourlyEnd);
      if (phaseEnd <= cursor) break;
      result.push({
        id: phase.id,
        title: phase.title || '未命名阶段',
        start: fmtDate(cursor),
        end: fmtDate(phaseEnd),
        startTime: hourKey(cursor),
        endTime: hourKey(phaseEnd),
        status: phase.status === 'done' ? 'done' : phase.status === 'doing' ? 'doing' : 'todo',
      });
      cursor = new Date(phaseEnd);
    }
    const tail = result[result.length - 1];
    if (tail && (tail.end !== fmtDate(hourlyEnd) || tail.endTime !== hourKey(hourlyEnd))) {
      tail.end = fmtDate(hourlyEnd);
      tail.endTime = hourKey(hourlyEnd);
    }
    return result.length > 0 ? result : undefined;
  }

  const start = parseDate(plannedStart);
  const end = parseDate(plannedEnd);
  if (!start || !end || dateDiff(start, end) < 0) return undefined;
  if (!Array.isArray(phases) || phases.length === 0) return undefined;

  if (dateDiff(start, end) === 0) {
    const only = phases[0];
    return [{
      id: only?.id || 'p1',
      title: only?.title || '阶段 1',
      start: fmtDate(start),
      end: fmtDate(end),
      status: only?.status === 'done' ? 'done' : only?.status === 'doing' ? 'doing' : 'todo',
    }];
  }

  const ordered = phases
    .filter((phase) => phase && typeof phase.id === 'string')
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  if (ordered.length === 0) return undefined;

  const result: TodoPhase[] = [];
  let cursor = new Date(start);
  const lastIndex = ordered.length - 1;
  for (let index = 0; index < ordered.length; index += 1) {
    // 可用天数已经分完时直接截断，避免产生 start 晚于 end 的畸形阶段。
    if (cursor > end) break;
    const phase = ordered[index];
    const isLast = index === lastIndex || fmtDate(cursor) === fmtDate(end);
    // 末阶段必须恰好收在计划结束日；其余阶段按自身 end 结束，再钳制回 [cursor, end]。
    let phaseEnd = isLast ? new Date(end) : parseDate(phase.end);
    if (!phaseEnd || phaseEnd < cursor) phaseEnd = new Date(cursor);
    if (phaseEnd > end) phaseEnd = new Date(end);
    result.push({
      id: phase.id,
      title: phase.title || '未命名阶段',
      start: fmtDate(cursor),
      end: fmtDate(phaseEnd),
      status: phase.status === 'done' ? 'done' : phase.status === 'doing' ? 'doing' : 'todo',
    });
    cursor = addDays(phaseEnd, 1);
  }
  // 截断后末阶段可能没收在结束日，把剩余天数并进末阶段。
  const tail = result[result.length - 1];
  if (tail && tail.end < fmtDate(end)) tail.end = fmtDate(end);
  return result;
}

function shiftPhases(phases: TodoPhase[], delta: number): TodoPhase[] {
  if (delta === 0) return phases;
  return phases.map((phase) => {
    const start = parseDate(phase.start);
    const end = parseDate(phase.end);
    if (!start || !end) return phase;
    return { ...phase, start: fmtDate(addDays(start, delta)), end: fmtDate(addDays(end, delta)) };
  });
}

function updateItemState(id: string, patch: TodoStatePatch): void {
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中修改任务状态');
    return;
  }
  todoState.items[id] = { ...(todoState.items[id] || {}), ...patch };
  pushTodoState();
}

// 排期时间是一对可选字段：两端都有才启用小时轴；任一端为空就退回按天排期。
function updateItemSchedule(id: string, plannedStart: string, plannedEnd: string, plannedStartTime?: string, plannedEndTime?: string): void {
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中修改任务状态');
    return;
  }
  const patch = { ...(todoState.items[id] || {}), status: 'doing' as const, plannedStart, plannedEnd };
  if (isHourKey(plannedStartTime) && isHourKey(plannedEndTime)) {
    patch.plannedStartTime = plannedStartTime;
    patch.plannedEndTime = plannedEndTime;
  } else {
    delete patch.plannedStartTime;
    delete patch.plannedEndTime;
  }
  todoState.items[id] = patch;
  pushTodoState();
}

function splitEvenly(phases: TodoPhase[], plannedStart: string, plannedEnd: string, plannedStartTime?: string, plannedEndTime?: string): TodoPhase[] {
  const hourlyStart = parseScheduledDateTime(plannedStart, plannedStartTime);
  const hourlyEnd = parseScheduledDateTime(plannedEnd, plannedEndTime);
  if (hourlyStart && hourlyEnd && hourlyEnd > hourlyStart) {
    const totalHours = hourDiff(hourlyStart, hourlyEnd);
    const count = Math.min(phases.length, totalHours);
    const base = Math.floor(totalHours / count);
    const remainder = totalHours % count;
    let cursor = new Date(hourlyStart);
    return phases.slice(0, count).map((phase, index) => {
      const hours = base + (index < remainder ? 1 : 0);
      const phaseEnd = addHours(cursor, hours);
      const next = { ...phase, start: fmtDate(cursor), end: fmtDate(phaseEnd), startTime: hourKey(cursor), endTime: hourKey(phaseEnd) };
      cursor = phaseEnd;
      return next;
    });
  }
  const start = parseDate(plannedStart) || new Date();
  const end = parseDate(plannedEnd) || start;
  const totalDays = Math.max(1, dateDiff(start, end) + 1);
  const count = Math.min(phases.length, totalDays);
  const base = Math.floor(totalDays / count);
  const remainder = totalDays % count;
  let cursor = new Date(start);
  return phases.slice(0, count).map((phase, index) => {
    const days = base + (index < remainder ? 1 : 0);
    const phaseEnd = addDays(cursor, days - 1);
    const next = { ...phase, start: fmtDate(cursor), end: fmtDate(phaseEnd) };
    cursor = addDays(phaseEnd, 1);
    return next;
  });
}

// refresh() 会重建弹窗 DOM，重建前先把用户当前输入抓回草稿，避免输入丢失。
function syncPhaseDraftFromDom(): void {
  const form = document.querySelector<HTMLFormElement>('[data-tb-phase-form]');
  if (!form || !phaseDraft) return;
  const plannedStart = form.dataset.plannedStart || todayStr();
  const plannedEnd = form.dataset.plannedEnd || plannedStart;
  const plannedStartTime = form.dataset.plannedStartTime;
  const plannedEndTime = form.dataset.plannedEndTime;
  const hourly = form.dataset.phaseGranularity === 'hour';
  const rows = Array.from(form.querySelectorAll<HTMLElement>('.todo-phase-row'));
  phaseDraft = rows.map((row, index) => {
    const previous = phaseDraft?.[index];
    const titleInput = row.querySelector<HTMLInputElement>('input[name="phaseTitle"]');
    const dateInput = row.querySelector<HTMLInputElement>('input[name="phaseEnd"]');
    const dateTimeInput = row.querySelector<HTMLInputElement>('input[name="phaseEndDateTime"]');
    const statusSelect = row.querySelector<HTMLSelectElement>('select[name="phaseStatus"]');
    const isLast = index === rows.length - 1;
    const endDateTime = dateTimeInput?.value || '';
    const [endDate = '', endTime = ''] = endDateTime.split('T');
    const phase: TodoPhase = {
      id: row.dataset.phaseRow || previous?.id || 'p' + (index + 1),
      title: titleInput?.value ?? previous?.title ?? '未命名阶段',
      start: previous?.start ?? plannedStart,
      end: isLast ? plannedEnd : (hourly ? (endDate || previous?.end || plannedEnd) : (dateInput?.value || previous?.end || plannedEnd)),
      status: statusSelect?.value === 'done' ? 'done' : statusSelect?.value === 'doing' ? 'doing' : 'todo',
    };
    if (hourly) {
      phase.startTime = previous?.startTime ?? plannedStartTime;
      phase.endTime = isLast ? plannedEndTime : (endTime || previous?.endTime || plannedEndTime);
    }
    return phase;
  });
}

function updateItemPhases(id: string, phases: TodoPhase[] | undefined): void {
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中划分任务阶段');
    return;
  }
  const patch = { ...(todoState.items[id] || {}) };
  if (!phases || phases.length === 0) {
    delete patch.phases;
  } else {
    patch.phases = phases;
  }
  todoState.items[id] = patch;
  pushTodoState();
}

function migrateLegacyLocalState(): void {
  if (!isEditable()) return;
  try {
    const raw = window.localStorage.getItem(LEGACY_TODO_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { version?: number; items?: Record<string, TodoStatePatch> };
    if (parsed?.version !== 1 || !parsed.items || typeof parsed.items !== 'object') return;
    const legacyItems = parsed.items;
    const count = Object.keys(legacyItems).length;
    if (count === 0) {
      window.localStorage.removeItem(LEGACY_TODO_STORAGE_KEY);
      return;
    }
    fetch('/__todo_sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), items: legacyItems }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        window.localStorage.removeItem(LEGACY_TODO_STORAGE_KEY);
        console.info(`[todo-board] 已把 ${count} 条旧 localStorage 看板状态迁移到 src/data/todo-state.json`);
      })
      .catch(() => showToast('⚠️ 旧看板状态迁移失败，请稍后刷新重试'));
  } catch {
    // 旧数据损坏时直接忽略，不影响看板正常使用。
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function currentDate(): Date {
  const previewDate = new URLSearchParams(window.location.search).get('previewDate');
  if (previewDate && /^\d{4}-\d{2}-\d{2}$/.test(previewDate)) {
    const parsed = new Date(previewDate + 'T12:00:00');
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function dateKey(): string {
  const d = currentDate();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayStr(): string {
  return dateKey();
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = currentDate();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff < 0) return d.getMonth() + 1 + '月' + d.getDate() + '日';
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff >= 2 && diff <= 6) return diff + ' 天前';
  if (diff >= 7 && diff <= 13) return '1 周前';
  if (diff >= 14 && diff <= 30) return Math.round(diff / 7) + ' 周前';
  return dateStr;
}

function escape(value: unknown): string {
  return escapeHtml(value);
}

function boards(): TodoBoard[] {
  return window.__TODO_BOARDS || [];
}

function archivedBoards(): TodoBoard[] {
  return window.__ARCHIVED_TODO_BOARDS || [];
}

function allItems(): BoardItem[] {
  const merged: BoardItem[] = [];
  boards()
    .filter((board) => SUMMARY_BOARD_IDS.includes(board.id))
    .forEach((board) => {
      board.items.forEach((item) => {
        const patch = todoState.items[item.id] || {};
        merged.push({
          ...applyTodoState(item, normalizePhases(
            patch.plannedStart ?? item.plannedStart,
            patch.plannedEnd ?? item.plannedEnd,
            patch.phases,
            patch.plannedStartTime ?? item.plannedStartTime,
            patch.plannedEndTime ?? item.plannedEndTime,
          )),
          sourceBoard: { id: board.id, name: board.name, icon: board.icon },
        });
      });
    });
  return merged;
}

function archivedItems(): BoardItem[] {
  const merged: BoardItem[] = [];
  archivedBoards()
    .filter((board) => SUMMARY_BOARD_IDS.includes(board.id))
    .forEach((board) => {
      board.items.forEach((item) => {
        const local = todoState.items[item.id] || {};
        merged.push({
          ...applyTodoState(item, normalizePhases(item.plannedStart, item.plannedEnd, local.phases, item.plannedStartTime, item.plannedEndTime)),
          // 归档任务的状态以归档文件为准（永远视为已完成）。
          // 状态补丁里残留的 status（如曾经的 'doing'）不允许把归档项标回进行中。
          status: 'done',
          // 完成日期仍可由「修改完成日期」交互更新，这里沿用补丁里的 completedAt（若有）。
          completedAt: local.completedAt ?? item.completedAt ?? item.date,
          archived: true,
          sourceBoard: { id: board.id, name: board.name, icon: board.icon },
        });
      });
    });
  return merged;
}

function todoItems(): BoardItem[] {
  const today = todayStr();
  return allItems()
    .filter((item) => (item.status || 'todo') === 'todo')
    .sort((a, b) => (a.date || today).localeCompare(b.date || today));
}

function doingItems(): BoardItem[] {
  return allItems().filter((item) => (item.status || 'todo') === 'doing');
}

function doneItems(): BoardItem[] {
  const today = todayStr();
  const items = new Map<string, BoardItem>();
  [...allItems(), ...archivedItems()].forEach((item) => {
    if ((item.status || 'todo') !== 'done') return;
    if ((item.completedAt || item.date || today) !== today) return;
    items.set(item.id, item);
  });
  return Array.from(items.values());
}

function boardStats() {
  const todo = todoItems().length;
  const doing = doingItems().length;
  const done = doneItems().length;
  const total = todo + doing + done;
  return {
    total,
    todo,
    doing,
    done,
    rate: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

function buildHeatmapData(): Map<string, HeatmapItem[]> {
  const map = new Map<string, HeatmapItem[]>();
  const seen = new Set<string>();
  [...archivedItems(), ...allItems()].forEach((item) => {
    if (seen.has(item.id)) return;
    const completedAt = item.completedAt || (item.status === 'done' ? item.date : undefined);
    if (!completedAt) return;
    seen.add(item.id);
    if (!map.has(completedAt)) map.set(completedAt, []);
    map.get(completedAt)?.push({
      title: item.title,
      url: item.url,
      boardName: item.sourceBoard?.name || '',
      boardIcon: item.sourceBoard?.icon || '✅',
    });
  });
  return map;
}

function fmtDate(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + pad(date.getDate());
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(dateStr + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

function isHourKey(time?: string): time is string {
  return typeof time === 'string' && /^([01]\d|2[0-3]):00$/.test(time);
}

function parseScheduledDateTime(date?: string, time?: string): Date | null {
  if (!parseDate(date) || !isHourKey(time)) return null;
  const value = new Date(date + 'T' + time + ':00');
  return Number.isNaN(value.getTime()) ? null : value;
}

function hasHourlySchedule(item: Pick<TodoItem, 'plannedStart' | 'plannedEnd' | 'plannedStartTime' | 'plannedEndTime'>): boolean {
  const start = parseScheduledDateTime(item.plannedStart, item.plannedStartTime);
  const end = parseScheduledDateTime(item.plannedEnd, item.plannedEndTime);
  return Boolean(start && end && end >= start);
}

function schedulePeriod(item: Pick<TodoItem, 'plannedStart' | 'plannedEnd' | 'plannedStartTime' | 'plannedEndTime'>): string {
  const datePeriod = shortDate(item.plannedStart) + '—' + shortDate(item.plannedEnd);
  if (!hasHourlySchedule(item)) return datePeriod;
  return shortDate(item.plannedStart) + ' ' + item.plannedStartTime + '—' + shortDate(item.plannedEnd) + ' ' + item.plannedEndTime;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateDiff(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function addHours(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + amount);
  return next;
}

function hourDiff(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 3600000);
}

function floorToHour(date: Date): Date {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  return next;
}

function shortDate(dateStr?: string): string {
  const date = parseDate(dateStr);
  return date ? (date.getMonth() + 1) + '/' + date.getDate() : '未设置';
}

function itemById(id: string | null): BoardItem | undefined {
  if (!id) return undefined;
  return [...allItems(), ...archivedItems()].find((item) => item.id === id);
}

function ganttItems(): BoardItem[] {
  const items = new Map<string, BoardItem>();
  [...allItems(), ...archivedItems()].forEach((item) => {
    if (items.has(item.id)) return;
    const start = parseDate(item.plannedStart);
    const end = parseDate(item.plannedEnd);
    const status = item.status || 'todo';
    if (!start || !end || dateDiff(start, end) < 0) return;
    if (status === 'doing' || (ganttShowCompleted && status === 'done')) items.set(item.id, item);
  });
  return Array.from(items.values()).sort((a, b) => (a.plannedStart || '').localeCompare(b.plannedStart || ''));
}

function ganttRange(items: BoardItem[]): { start: Date; end: Date; days: Date[] } {
  const today = parseDate(todayStr()) || new Date();
  let start = new Date(today);
  let end = new Date(today);
  items.forEach((item) => {
    const itemStart = parseDate(item.plannedStart);
    const itemEnd = parseDate(item.plannedEnd);
    if (itemStart && itemStart < start) start = itemStart;
    if (itemEnd && itemEnd > end) end = itemEnd;
  });
  start = addDays(start, -2);
  end = addDays(end, 2);
  while (dateDiff(start, end) < 13) end = addDays(end, 1);
  const days: Date[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(new Date(cursor));
  }
  return { start, end, days };
}

function heatmapColorLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 8) return 3;
  return 4;
}

function renderHeatmap(): string {
  const data = buildHeatmapData();
  const today = currentDate();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  let startDay = start.getDay();
  if (startDay === 0) startDay = 7;
  start.setDate(start.getDate() - (startDay - 1));

  const end = new Date(today);
  let endDay = end.getDay();
  if (endDay === 0) endDay = 7;
  end.setDate(end.getDate() + (7 - endDay));

  const dayLabels = ['', '一', '', '三', '', '五', ''];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weeks: { date: Date; ds: string; count: number }[][] = [];
  const cursor = new Date(start);
  const todayValue = todayStr();

  while (cursor <= end) {
    const week: { date: Date; ds: string; count: number }[] = [];
    for (let index = 0; index < 7; index += 1) {
      const ds = fmtDate(cursor);
      week.push({ date: new Date(cursor), ds, count: (data.get(ds) || []).length });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthStarts: { weekIndex: number; label: string }[] = [];
  let lastMonthKey = '';
  weeks.forEach((week, weekIndex) => {
    const monthStart = week.find((item) => item.date.getDate() === 1);
    const labelDate = monthStart || (weekIndex === 0 ? week[0] : null);
    if (!labelDate) return;
    const monthKey = labelDate.date.getFullYear() + '-' + labelDate.date.getMonth();
    if (monthKey === lastMonthKey) return;
    monthStarts.push({ weekIndex, label: monthNames[labelDate.date.getMonth()] });
    lastMonthKey = monthKey;
  });
  const monthLabels = monthStarts.map((month, index) => {
    const nextWeekIndex = monthStarts[index + 1]?.weekIndex || weeks.length;
    const span = Math.max(1, nextWeekIndex - month.weekIndex);
    return '<span class="hm-month-label" style="grid-column: ' + (month.weekIndex + 2) + ' / span ' + span + '">' + month.label + '</span>';
  }).join('');

  const dayRows = [0, 1, 2, 3, 4, 5, 6].map((rowIndex) => {
    const cells = weeks.map((week) => {
      const item = week[rowIndex];
      if (!item) return '<span></span>';
      if (item.ds > todayValue) return '<span class="hm-cell hm-future" aria-hidden="true"></span>';
      const level = heatmapColorLevel(item.count);
      const className = 'hm-cell' + (level > 0 ? ' hm-lvl-' + level : '') + (item.ds === selectedHeatmapDate ? ' hm-selected' : '');
      return '<button class="' + className + '" data-hm-date="' + item.ds + '" type="button" aria-label="' + item.ds + ' · ' + item.count + ' 条完成记录" title="' + item.ds + ' · ' + item.count + ' 条"></button>';
    }).join('');
    return '<span class="hm-day-label">' + dayLabels[rowIndex] + '</span>' + cells;
  }).join('');

  const completedDays = data.size;
  const completedItems = Array.from(data.values()).reduce((total, items) => total + items.length, 0);
  return '<section class="todo-board-history" aria-label="已完成历史">' +
    '<div class="todo-board-history-heading">' +
      '<h3 class="todo-board-history-title">📜 已完成历史</h3>' +
      '<span class="hm-summary">过去一年 · ' + completedDays + ' 天 · ' + completedItems + ' 项</span>' +
    '</div>' +
    '<div class="hm-outer">' +
      '<div class="hm-chart">' +
        '<div class="hm-months" style="--hm-week-count: ' + weeks.length + '"><span></span>' + monthLabels + '</div>' +
        '<div class="hm-grid" style="--hm-week-count: ' + weeks.length + '" role="grid" aria-label="过去一年的完成记录">' + dayRows + '</div>' +
        '<div class="hm-legend"><span>少</span><span class="hm-cell"></span><span class="hm-cell hm-lvl-1"></span><span class="hm-cell hm-lvl-2"></span><span class="hm-cell hm-lvl-3"></span><span class="hm-cell hm-lvl-4"></span><span>多</span></div>' +
      '</div>' +
    '</div>' +
    renderHeatmapPopover(data) +
  '</section>';
}

function renderHeatmapPopover(data: Map<string, HeatmapItem[]>): string {
  if (!selectedHeatmapDate) return '';
  const items = data.get(selectedHeatmapDate) || [];
  const pageCount = Math.max(1, Math.ceil(items.length / HEATMAP_PAGE_SIZE));
  const currentPage = Math.min(heatmapPage, pageCount - 1);
  const visibleItems = items.slice(currentPage * HEATMAP_PAGE_SIZE, (currentPage + 1) * HEATMAP_PAGE_SIZE);
  const itemHtml = items.length === 0
    ? '<div class="hm-popover-empty"><span class="hm-popover-empty-mark">—</span><span>这一天还没有完成记录</span></div>'
    : visibleItems.map((item, index) => {
      const title = item.url
        ? '<a href="' + escape(item.url) + '" target="_blank" rel="noopener" class="hm-popover-link">' + escape(item.title) + '</a>'
        : escape(item.title);
      const board = item.boardName
        ? '<span class="hm-popover-board">' + escape(item.boardIcon) + ' ' + escape(item.boardName) + '</span>'
        : '<span class="hm-popover-board">' + escape(item.boardIcon) + ' 任务</span>';
      const itemIndex = currentPage * HEATMAP_PAGE_SIZE + index + 1;
      return '<li class="hm-popover-item"><span class="hm-popover-item-index">' + String(itemIndex).padStart(2, '0') + '</span><div class="hm-popover-item-body"><div class="hm-popover-item-meta">' + board + '</div><div class="hm-popover-item-title">' + title + '</div></div></li>';
    }).join('');
  const pagination = pageCount > 1
    ? '<div class="hm-popover-pagination" aria-label="完成记录分页"><button type="button" data-hm-page="prev" data-hm-page-count="' + pageCount + '"' + (currentPage === 0 ? ' disabled' : '') + ' aria-label="上一页">‹</button><span><strong>' + (currentPage + 1) + '</strong><i>/</i>' + pageCount + '</span><button type="button" data-hm-page="next" data-hm-page-count="' + pageCount + '"' + (currentPage === pageCount - 1 ? ' disabled' : '') + ' aria-label="下一页">›</button></div>'
    : '';

  return '<div class="hm-popover-backdrop" data-hm-close></div>' +
    '<section class="hm-popover" role="dialog" aria-modal="true" aria-label="' + escape(selectedHeatmapDate) + ' 完成记录">' +
      '<div class="hm-popover-header">' +
        '<div class="hm-popover-kicker"><span class="hm-popover-kicker-dot"></span><span>完成记录</span></div>' +
        '<span class="hm-popover-count">' + items.length + ' 条</span>' +
        '<button class="hm-popover-close" data-hm-close aria-label="关闭">✕</button>' +
      '</div>' +
      '<div class="hm-popover-date-row"><strong class="hm-popover-date-value">' + escape(selectedHeatmapDate) + '</strong><span class="hm-popover-date-rel">' + escape(relativeTime(selectedHeatmapDate)) + '</span></div>' +
      '<ul class="hm-popover-list">' + itemHtml + '</ul>' +
      pagination +
    '</section>';
}

function renderCard(item: BoardItem): string {
  const boardIcon = item.sourceBoard
    ? '<span class="todo-card-badge" role="img" aria-label="' + escape(item.sourceBoard.name) + '" title="' + escape(item.sourceBoard.name) + '">' + escape(item.sourceBoard.icon) + ' ' + escape(item.sourceBoard.name) + '</span>'
    : '';
  const scheduleAction = isEditable() && (item.status === 'todo' || item.status === 'doing')
    ? '<button type="button" class="todo-card-action" data-tb-schedule="' + escape(item.id) + '">' + (item.status === 'doing' ? '调整排期' : '开始排期') + '</button>'
    : '';
  const completionAction = isEditable()
    ? (item.status === 'done'
      ? '<button type="button" class="todo-card-action" data-tb-edit-completed="' + escape(item.id) + '">修改完成日期</button>'
      : '<button type="button" class="todo-card-action" data-tb-complete="' + escape(item.id) + '">完成</button>')
    : '';
  // 仅活动任务可从「当天完成」退回待办；归档数据代表不可逆的历史记录。
  const returnToTodoAction = isEditable() && item.status === 'done' && !item.archived
    ? '<button type="button" class="todo-card-action" data-tb-return-todo="' + escape(item.id) + '">退回待办</button>'
    : '';
  const editAction = isEditable() && !item.archived
    ? '<button type="button" class="todo-card-action" data-tb-edit="' + escape(item.id) + '">编辑</button>'
    : '';
  // 归档条目不可删；其余任务 dev 下都可删（POST /__todo_file 直接改 todo-data.ts）。
  const deleteAction = isEditable() && !item.archived
    ? '<button type="button" class="todo-card-action todo-card-action-danger" data-tb-delete="' + escape(item.id) + '">删除</button>'
    : '';
  const actions = scheduleAction || editAction || completionAction || returnToTodoAction || deleteAction ? '<div class="todo-card-actions">' + scheduleAction + editAction + completionAction + returnToTodoAction + deleteAction + '</div>' : '';
  const title = item.url
    ? '<a href="' + escape(item.url) + '" target="_blank" rel="noopener" class="todo-card-link"><h3 class="todo-card-title">' + escape(item.title) + '</h3></a>'
    : '<h3 class="todo-card-title">' + escape(item.title) + '</h3>';
  const note = item.note ? '<p class="todo-card-note">' + escape(item.note) + '</p>' : '';
  const phases = item.phases || [];
  const currentPhase = phases.find((phase) => phase.status === 'doing') || phases.find((phase) => phase.status === 'todo');
  const phaseStrip = phases.length > 0
    ? '<div class="todo-card-phases" data-tb-phase-tooltip data-phase-list="' + escape(phases.map((phase) => phase.title + '（' + (phase.startTime ? shortDate(phase.start) + ' ' + phase.startTime + '—' + shortDate(phase.end) + ' ' + phase.endTime : shortDate(phase.start) + '—' + shortDate(phase.end)) + '）').join(' → ')) + '">' +
        '<span class="todo-card-phase-track">' + phases.map((phase) => {
          const phaseStart = phaseDateTime(phase, 'start');
          const phaseEnd = phaseDateTime(phase, 'end');
          const weight = phaseStart && phaseEnd ? Math.max(1, hourDiff(phaseStart, phaseEnd)) : (() => {
            const start = parseDate(phase.start);
            const end = parseDate(phase.end);
            return start && end ? Math.max(1, dateDiff(start, end) + 1) : 1;
          })();
          return '<span class="todo-card-phase is-' + phase.status + '" style="--phase-weight: ' + weight + '"></span>';
        }).join('') + '</span>' +
        (currentPhase ? '<span class="todo-card-phase-label">' + escape(currentPhase.title) + '</span>' : '') +
      '</div>'
    : '';
  const dateValue = item.status === 'done' ? (item.completedAt || item.date) : item.date;
  const dateIcon = item.status === 'done' ? '✅' : '📅';
  const due = dateValue ? '<span class="todo-card-meta-item"><span class="todo-card-meta-icon">' + dateIcon + '</span> ' + escape(relativeTime(dateValue)) + '</span>' : '';
  const schedule = item.status === 'doing' && item.plannedStart && item.plannedEnd
    ? '<span class="todo-card-meta-item"><span class="todo-card-meta-icon">⏱</span> ' + escape(schedulePeriod(item)) + '</span>'
    : '';
  const created = item.createdAt ? '<span class="todo-card-meta-item"><span class="todo-card-meta-icon">🕒</span> ' + escape(relativeTime(item.createdAt)) + '</span>' : '';
  const meta = due || schedule || created ? '<div class="todo-card-meta">' + due + schedule + created + '</div>' : '';
  const className = 'todo-card' + (item.status === 'doing' ? ' todo-card-doing' : '') + (item.status === 'done' ? ' todo-card-done' : '');
  return '<article class="' + className + '"><div class="todo-card-topline">' + boardIcon + actions + '</div>' + title + meta + phaseStrip + note + '</article>';
}

function renderViewSwitch(): string {
  return '<div class="todo-board-view-switch" role="tablist" aria-label="任务视图">' +
    '<button type="button" class="todo-board-view-button' + (currentView === 'board' ? ' active' : '') + '" data-tb-view="board" aria-selected="' + (currentView === 'board' ? 'true' : 'false') + '">看板视图</button>' +
    '<button type="button" class="todo-board-view-button' + (currentView === 'gantt' ? ' active' : '') + '" data-tb-view="gantt" aria-selected="' + (currentView === 'gantt' ? 'true' : 'false') + '">甘特图</button>' +
  '</div>';
}

interface HourGanttRange {
  start: Date;
  end: Date;
  hours: Date[];
}

function hourGanttRange(items: BoardItem[]): HourGanttRange | null {
  const dates = items.flatMap((item) => {
    const start = parseScheduledDateTime(item.plannedStart, item.plannedStartTime);
    const end = parseScheduledDateTime(item.plannedEnd, item.plannedEndTime);
    return start && end ? [start, end] : [];
  });
  if (dates.length === 0) return null;
  let start = floorToHour(new Date(Math.min(...dates.map((date) => date.getTime()))));
  let end = floorToHour(new Date(Math.max(...dates.map((date) => date.getTime()))));
  start = addHours(start, -1);
  end = addHours(end, 2);
  while (hourDiff(start, end) < 24) end = addHours(end, 1);
  const hours: Date[] = [];
  for (let cursor = new Date(start); cursor < end; cursor = addHours(cursor, 1)) hours.push(new Date(cursor));
  return { start, end, hours };
}

function renderGantt(): string {
  const scheduledItems = ganttItems();
  // 两种排期精度互斥：有完整小时范围的短任务只在小时轴显示，其他任务才在日期轴显示。
  const dayItems = scheduledItems.filter((item) => !hasHourlySchedule(item));
  const dayRange = ganttRange(dayItems);
  const hourItems = scheduledItems.filter(hasHourlySchedule);
  const hourlyRange = hourGanttRange(hourItems);
  const windowLabel = ganttGranularity === 'hour' && hourlyRange
    ? shortDate(fmtDate(hourlyRange.start)) + ' ' + String(hourlyRange.start.getHours()).padStart(2, '0') + ':00—' + shortDate(fmtDate(hourlyRange.end)) + ' ' + String(hourlyRange.end.getHours()).padStart(2, '0') + ':00'
    : shortDate(fmtDate(dayRange.start)) + '—' + shortDate(fmtDate(dayRange.end));
  const toolbar = '<div class="todo-gantt-toolbar">' +
    '<div><h2 class="todo-gantt-title">任务甘特图</h2><p class="todo-gantt-subtitle">按天排期可拖拽调整；短任务可填写整点时间并切换到小时轴。</p></div>' +
    '<div class="todo-gantt-side">' +
      '<div class="todo-gantt-controls"><span class="todo-gantt-scale" role="group" aria-label="甘特图精度"><button type="button" class="todo-gantt-scale-button' + (ganttGranularity === 'day' ? ' is-active' : '') + '" data-tb-gantt-scale="day" aria-pressed="' + (ganttGranularity === 'day' ? 'true' : 'false') + '">按天</button><button type="button" class="todo-gantt-scale-button' + (ganttGranularity === 'hour' ? ' is-active' : '') + '" data-tb-gantt-scale="hour" aria-pressed="' + (ganttGranularity === 'hour' ? 'true' : 'false') + '">按小时</button></span><label><input type="checkbox" data-tb-gantt-completed' + (ganttShowCompleted ? ' checked' : '') + '> 显示已完成</label></div>' +
      '<span class="todo-gantt-window">' + windowLabel + '</span>' +
    '</div>' +
  '</div>';
  if (ganttGranularity === 'hour') return renderHourGantt(scheduledItems, hourItems, hourlyRange, toolbar);
  if (dayItems.length === 0) {
    return '<section class="todo-gantt" aria-label="任务甘特图">' + toolbar + '<div class="todo-gantt-empty"><strong>还没有按天排期的任务</strong><span>填写了具体小时的短任务会显示在“按小时”视图；其他任务可按日期排期。</span></div></section>';
  }

  const items = dayItems;
  const range = dayRange;
  const gridStyle = '--todo-gantt-days: ' + range.days.length + '; --todo-gantt-columns: repeat(' + range.days.length + ', minmax(2.6rem, 1fr));';
  const axis = range.days.map((day) => {
    const isToday = fmtDate(day) === todayStr();
    return '<span class="todo-gantt-day' + (isToday ? ' is-today' : '') + '" data-today="' + isToday + '">' + shortDate(fmtDate(day)) + '</span>';
  }).join('');
  const rows = items.map((item) => {
    const start = parseDate(item.plannedStart) || range.start;
    const end = parseDate(item.plannedEnd) || start;
    const startColumn = dateDiff(range.start, start) + 1;
    const span = Math.max(1, dateDiff(start, end) + 1);
    const status = item.status === 'done' ? 'done' : 'doing';
    const period = schedulePeriod(item);
    const phases = item.phases || [];
    // 有阶段时按钮显示「进度点 + 当前阶段名」，一眼看出分了几段、走到哪一段。
const currentPhase = phases.find((phase) => phase.status === 'doing')
  || phases.find((phase) => phase.status === 'todo')
  || phases[phases.length - 1];
const phaseProgressDots = phases.map((phase) => {
  const dotClass = phase.status === 'done' ? 'is-done' : phase.status === 'doing' ? 'is-doing' : 'is-todo';
  return '<i class="todo-phase-dot ' + dotClass + '"></i>';
}).join('');
const phaseButtonLabel = phases.length > 0 && currentPhase
  ? '<span class="todo-phase-dots">' + phaseProgressDots + '</span><span class="todo-phase-current">' + escape(currentPhase.title) + '</span>'
  : '分阶段';
const phaseButton = isEditable()
  ? '<button type="button" class="todo-gantt-phases-open' + (phases.length > 0 ? ' is-set' : '') + '" data-tb-gantt-phases="' + escape(item.id) + '" aria-label="划分阶段：' + escape(item.title) + '">' + phaseButtonLabel + '</button>'
  : '';
    const removeButton = isEditable()
      ? '<button type="button" class="todo-gantt-remove" data-tb-gantt-remove="' + escape(item.id) + '" aria-label="移出甘特图：' + escape(item.title) + '">移出甘特图</button>'
      : '';
    // 把两个按钮包成一个 actions 块；标签列用 1fr / 1fr / 1fr 三列等宽布局，按钮组在标题下方独立占一整行。
    const actionsBlock = phaseButton || removeButton
      ? '<div class="todo-gantt-actions">' + phaseButton + removeButton + '</div>'
      : '';
    const phaseCells = phases.map((phase, index) => {
      const phaseStart = parseDate(phase.start) || start;
      const phaseEnd = parseDate(phase.end) || phaseStart;
      const phaseStartColumn = dateDiff(start, phaseStart) + 1;
      const phaseSpan = Math.max(1, dateDiff(phaseStart, phaseEnd) + 1);
      const phasePeriod = shortDate(phase.start) + '—' + shortDate(phase.end);
      const phaseStatusLabel = phase.status === 'done' ? '已完成' : phase.status === 'doing' ? '进行中' : '未开始';
      const cell = '<span class="todo-gantt-phase is-' + phase.status + '" data-phase-index="' + index + '" style="--phase-start: ' + phaseStartColumn + '; --phase-span: ' + phaseSpan + '" data-tb-phase-tooltip data-phase-title="' + escape(phase.title) + '" data-phase-period="' + escape(phasePeriod) + '" data-phase-status="' + phase.status + '" data-phase-status-label="' + escape(phaseStatusLabel) + '">' +
        // 阶段平铺最多 4 个字符，超出截断；悬浮窗始终展示完整名字。
        (phase.title ? '<span class="todo-gantt-phase-copy">' + escape(truncatePhaseTitle(phase.title)) + '</span>' : '') +
      '</span>';
      // 相邻阶段之间的分割缝：拖动它在左右两个阶段之间重新分配天数，下游阶段不受影响。
      const isLast = index === phases.length - 1;
      if (isLast || !isEditable()) return cell;
      const seamLeft = ((phaseStartColumn + phaseSpan - 1) / span) * 100;
      const seam = '<span class="todo-gantt-phase-seam" data-tb-phase-seam data-seam-item="' + escape(item.id) + '" data-seam-index="' + index + '" style="left: ' + seamLeft.toFixed(4) + '%;" role="separator" aria-label="拖动调整「' + escape(phase.title) + '」与下一段的边界" title="拖动调整相邻阶段的边界"></span>';
      return cell + seam;
    }).join('');
    const barInner = phases.length > 0
      ? '<span class="todo-gantt-phases" style="--todo-gantt-span: ' + span + '">' + phaseCells + '</span>'
      : '<span class="todo-gantt-bar-copy"><strong>' + escape(item.title) + '</strong><small data-gantt-period>' + escape(period) + '</small></span>';
    return '<div class="todo-gantt-row" data-task-id="' + escape(item.id) + '">' +
      '<div class="todo-gantt-label">' +
        '<div class="todo-gantt-label-content"><span class="todo-gantt-board-icon" role="img" aria-label="' + escape(item.sourceBoard?.name || '') + '">' + escape(item.sourceBoard?.icon || '') + '</span><span class="todo-gantt-task-title">' + escape(item.title) + '</span></div>' +
        actionsBlock +
      '</div>' +
      '<div class="todo-gantt-track" data-task-track="' + escape(item.id) + '">' +
        '<button type="button" class="todo-gantt-bar todo-gantt-bar-' + status + (phases.length > 0 ? ' has-phases' : '') + '" data-tb-gantt-bar data-task-id="' + escape(item.id) + '" data-start="' + escape(item.plannedStart || '') + '" data-end="' + escape(item.plannedEnd || '') + '" style="--todo-gantt-start: ' + startColumn + '; --todo-gantt-span: ' + span + ';" aria-label="' + escape(item.title + '，计划' + period + (phases.length > 0 ? '，共 ' + phases.length + ' 个阶段' : '')) + '">' +
          '<span class="todo-gantt-handle" data-gantt-edge="start" aria-hidden="true"></span>' + barInner + '<span class="todo-gantt-handle" data-gantt-edge="end" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<section class="todo-gantt" aria-label="任务甘特图">' + toolbar +
    '<div class="todo-gantt-scroll"><div class="todo-gantt-grid" data-range-start="' + escape(fmtDate(range.start)) + '" data-gantt-days="' + range.days.length + '" style="' + gridStyle + '">' +
      '<div class="todo-gantt-axis-row"><span class="todo-gantt-axis-label">任务 / 计划</span><div class="todo-gantt-axis-track">' + axis + '</div></div>' + rows +
    '</div></div>' +
    '<div class="todo-gantt-legend"><span><i class="todo-gantt-legend-swatch"></i>进行中</span><span><i class="todo-gantt-legend-swatch is-done"></i>已完成</span><span><i class="todo-gantt-legend-swatch is-todo"></i>未开始阶段</span><span>拖动整条移动计划，拖动两端调整日期</span></div>' +
  '</section>';
}

function renderHourGantt(allScheduledItems: BoardItem[], items: BoardItem[], range: HourGanttRange | null, toolbar: string): string {
  if (!range || items.length === 0) {
    return '<section class="todo-gantt" aria-label="任务甘特图（按小时）">' + toolbar + '<div class="todo-gantt-empty"><strong>还没有按小时排期的任务</strong><span>在看板里点击“开始排期”或“调整排期”，同时填写开始和结束的整点时间后，会显示在这里。</span></div></section>';
  }
  const gridStyle = '--todo-gantt-hours: ' + range.hours.length + '; --todo-gantt-columns: repeat(' + range.hours.length + ', minmax(3.35rem, 1fr));';
  const axis = range.hours.map((hour, index) => {
    const isToday = fmtDate(hour) === todayStr();
    const showDate = index === 0 || hour.getHours() === 0;
    const label = String(hour.getHours()).padStart(2, '0') + ':00';
    return '<span class="todo-hour-gantt-hour' + (isToday ? ' is-today' : '') + (showDate ? ' is-day-start' : '') + '" data-today="' + isToday + '">' + (showDate ? '<small>' + shortDate(fmtDate(hour)) + '</small>' : '') + '<b>' + label + '</b></span>';
  }).join('');
  const rows = items.map((item) => {
    const start = parseScheduledDateTime(item.plannedStart, item.plannedStartTime) || range.start;
    const end = parseScheduledDateTime(item.plannedEnd, item.plannedEndTime) || addHours(start, 1);
    const startColumn = hourDiff(range.start, start) + 1;
    const span = Math.max(1, hourDiff(start, end));
    const status = item.status === 'done' ? 'done' : 'doing';
    const period = schedulePeriod(item);
    const phases = item.phases || [];
    const currentPhase = phases.find((phase) => phase.status === 'doing')
      || phases.find((phase) => phase.status === 'todo')
      || phases[phases.length - 1];
    const phaseDots = phases.map((phase) => '<i class="todo-phase-dot ' + (phase.status === 'done' ? 'is-done' : phase.status === 'doing' ? 'is-doing' : 'is-todo') + '"></i>').join('');
    const phaseButtonLabel = phases.length > 0 && currentPhase
      ? '<span class="todo-phase-dots">' + phaseDots + '</span><span class="todo-phase-current">' + escape(currentPhase.title) + '</span>'
      : '分阶段';
    const phaseButton = isEditable()
      ? '<button type="button" class="todo-gantt-phases-open' + (phases.length > 0 ? ' is-set' : '') + '" data-tb-gantt-phases="' + escape(item.id) + '" aria-label="划分阶段：' + escape(item.title) + '">' + phaseButtonLabel + '</button>'
      : '';
    const removeButton = isEditable()
      ? '<button type="button" class="todo-gantt-remove" data-tb-gantt-remove="' + escape(item.id) + '">移出甘特图</button>'
      : '';
    const actions = isEditable()
      ? '<div class="todo-gantt-actions">' + phaseButton + removeButton + '</div>'
      : '';
    const phaseCells = phases.map((phase, index) => {
      const phaseStart = phaseDateTime(phase, 'start') || start;
      const phaseEnd = phaseDateTime(phase, 'end') || phaseStart;
      const phaseStartColumn = hourDiff(start, phaseStart) + 1;
      const phaseSpan = Math.max(1, hourDiff(phaseStart, phaseEnd));
      const phasePeriod = shortDate(phase.start) + ' ' + (phase.startTime || '') + '—' + shortDate(phase.end) + ' ' + (phase.endTime || '');
      const phaseStatusLabel = phase.status === 'done' ? '已完成' : phase.status === 'doing' ? '进行中' : '未开始';
      const cell = '<span class="todo-gantt-phase is-' + phase.status + '" data-phase-index="' + index + '" style="--phase-start: ' + phaseStartColumn + '; --phase-span: ' + phaseSpan + '" data-tb-phase-tooltip data-phase-title="' + escape(phase.title) + '" data-phase-period="' + escape(phasePeriod) + '" data-phase-status="' + phase.status + '" data-phase-status-label="' + escape(phaseStatusLabel) + '">' +
        (phase.title ? '<span class="todo-gantt-phase-copy">' + escape(truncatePhaseTitle(phase.title)) + '</span>' : '') +
      '</span>';
      if (index === phases.length - 1 || !isEditable()) return cell;
      const seamLeft = ((phaseStartColumn + phaseSpan - 1) / span) * 100;
      return cell + '<span class="todo-gantt-phase-seam" data-tb-hour-phase-seam data-seam-item="' + escape(item.id) + '" data-seam-index="' + index + '" style="left: ' + seamLeft.toFixed(4) + '%" role="separator" aria-label="拖动调整「' + escape(phase.title) + '」与下一阶段的边界" title="拖动调整相邻阶段的边界"></span>';
    }).join('');
    const barInner = phases.length > 0
      ? '<span class="todo-hour-gantt-phases" style="--todo-gantt-span: ' + span + '">' + phaseCells + '</span>'
      : '<span class="todo-hour-gantt-bar-copy"><strong>' + escape(item.title) + '</strong><small>' + escape(period) + '</small></span>';
    return '<div class="todo-gantt-row" data-task-id="' + escape(item.id) + '">' +
      '<div class="todo-gantt-label"><div class="todo-gantt-label-content"><span class="todo-gantt-board-icon" role="img" aria-label="' + escape(item.sourceBoard?.name || '') + '">' + escape(item.sourceBoard?.icon || '') + '</span><span class="todo-gantt-task-title">' + escape(item.title) + '</span></div>' + actions + '</div>' +
      '<div class="todo-hour-gantt-track" data-hour-task-track="' + escape(item.id) + '"><div class="todo-hour-gantt-bar todo-hour-gantt-bar-' + status + (phases.length > 0 ? ' has-phases' : '') + '" data-tb-hour-gantt-bar data-task-id="' + escape(item.id) + '" data-start="' + escape(fmtDate(start)) + '" data-start-time="' + escape(hourKey(start)) + '" data-end="' + escape(fmtDate(end)) + '" data-end-time="' + escape(hourKey(end)) + '" style="--todo-gantt-start: ' + startColumn + '; --todo-gantt-span: ' + span + ';" aria-label="' + escape(item.title + '，计划' + period + (phases.length > 0 ? '，共 ' + phases.length + ' 个阶段' : '')) + '"><span class="todo-gantt-handle" data-hour-gantt-edge="start" aria-hidden="true"></span>' + barInner + '<span class="todo-gantt-handle" data-hour-gantt-edge="end" aria-hidden="true"></span></div></div>' +
    '</div>';
  }).join('');
  const dateOnlyCount = allScheduledItems.length - items.length;
  const note = dateOnlyCount > 0
    ? '另有 ' + dateOnlyCount + ' 项仅按日期排期的任务，请在“按天”查看。'
    : '按小时排期任务也可划分阶段。';
  return '<section class="todo-gantt todo-hour-gantt" aria-label="任务甘特图（按小时）">' + toolbar +
    '<div class="todo-gantt-scroll"><div class="todo-hour-gantt-grid" data-gantt-hours="' + range.hours.length + '" data-range-start="' + escape(fmtDate(range.start)) + '" data-range-start-time="' + escape(hourKey(range.start)) + '" data-range-end="' + escape(fmtDate(range.end)) + '" data-range-end-time="' + escape(hourKey(range.end)) + '" style="' + gridStyle + '"><div class="todo-gantt-axis-row"><span class="todo-gantt-axis-label">任务 / 时间</span><div class="todo-hour-gantt-axis-track">' + axis + '</div></div>' + rows + '</div></div>' +
    '<div class="todo-gantt-legend"><span><i class="todo-gantt-legend-swatch"></i>进行中</span><span><i class="todo-gantt-legend-swatch is-done"></i>已完成</span><span>' + note + '</span><span>拖动阶段分割线可按小时调整边界</span></div>' +
  '</section>';
}

function renderScheduleModal(): string {
  const item = itemById(scheduleItemId);
  if (!item) return '';
  const isEditing = item.status === 'doing';
  return '<div class="todo-modal-backdrop" data-tb-modal-close></div>' +
    '<section class="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-schedule-title">' +
      '<div class="todo-modal-header"><div><span class="todo-modal-kicker">' + (isEditing ? '调整甘特图计划' : '加入甘特图') + '</span><h2 id="todo-schedule-title">' + escape(item.title) + '</h2></div><button type="button" class="todo-modal-close" data-tb-modal-close aria-label="关闭">✕</button></div>' +
      '<form data-tb-schedule-form data-task-id="' + escape(item.id) + '">' +
        '<p class="todo-modal-help">填写计划开始和结束日期。若是 1–2 天内的小任务，可同时填写整点时间，它会出现在甘特图的“按小时”视图。保存后，这个任务才会变为“进行中”。</p>' +
        '<div class="todo-date-fields"><label>计划开始日期<input type="date" name="plannedStart" value="' + escape(item.plannedStart || '') + '" required></label><label>计划结束日期<input type="date" name="plannedEnd" value="' + escape(item.plannedEnd || '') + '" required></label></div>' +
        '<div class="todo-date-fields todo-time-fields"><label>开始时间（可选）<input type="time" name="plannedStartTime" step="3600" value="' + escape(item.plannedStartTime || '') + '"></label><label>结束时间（可选）<input type="time" name="plannedEndTime" step="3600" value="' + escape(item.plannedEndTime || '') + '"></label></div>' +
        '<div class="todo-modal-actions"><button type="button" class="todo-modal-secondary" data-tb-modal-close>取消</button><button type="submit" class="todo-modal-primary">' + (isEditing ? '保存排期' : '加入甘特图') + '</button></div>' +
      '</form>' +
    '</section>';
}

function renderCompletionModal(): string {
  const item = itemById(completionItemId);
  if (!item) return '';
  return '<div class="todo-modal-backdrop" data-tb-modal-close></div>' +
    '<section class="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-completion-title">' +
      '<div class="todo-modal-header"><div><span class="todo-modal-kicker">修改实际完成日期</span><h2 id="todo-completion-title">' + escape(item.title) + '</h2></div><button type="button" class="todo-modal-close" data-tb-modal-close aria-label="关闭">✕</button></div>' +
      '<form data-tb-completion-form data-task-id="' + escape(item.id) + '">' +
        '<label class="todo-completion-field">实际完成日期<input type="date" name="completedAt" value="' + escape(item.completedAt || item.date || todayStr()) + '" required></label>' +
        '<div class="todo-modal-actions"><button type="button" class="todo-modal-secondary" data-tb-modal-close>取消</button><button type="submit" class="todo-modal-primary">保存完成日期</button></div>' +
      '</form>' +
    '</section>';
}

function renderNewItemModal(): string {
  if (!newItemOpen) return '';
  const summaryBoards = boards().filter((board) => SUMMARY_BOARD_IDS.includes(board.id));
  const firstBoard = summaryBoards[0];
  if (!firstBoard) return '';
  const editingItem = editItemId ? itemById(editItemId) : undefined;
  const isEditing = Boolean(editingItem && !editingItem.archived);
  const selectedBoardId = editingItem?.sourceBoard?.id || firstBoard.id;
  const boardOptions = summaryBoards.map((board, index) =>
    '<li role="option" class="todo-new-dropdown-option' + (board.id === selectedBoardId ? ' is-selected' : '') + '" data-board-option="' + escape(board.id) + '" aria-selected="' + (board.id === selectedBoardId ? 'true' : 'false') + '">' + escape(board.icon + ' ' + board.name) + '</li>'
  ).join('');
  const selectedBoard = summaryBoards.find((board) => board.id === selectedBoardId) || firstBoard;
  const modalTitle = isEditing ? '编辑任务' : '新增任务';
  const submitLabel = isEditing ? '保存修改' : '添加任务';
  return '<div class="todo-modal-backdrop" data-tb-modal-close></div>' +
    '<section class="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-new-title">' +
      '<div class="todo-modal-header"><div><span class="todo-modal-kicker todo-new-title" id="todo-new-title">' + modalTitle + '</span></div><button type="button" class="todo-modal-close" data-tb-modal-close aria-label="关闭">✕</button></div>' +
      '<form data-tb-new-form' + (isEditing ? ' data-editing-id="' + escape(editingItem?.id) + '"' : '') + '>' +
        '<div class="todo-new-field"><span class="todo-new-field-label">看板分类</span>' +
          '<div class="todo-new-dropdown" data-new-board-dropdown>' +
            '<button type="button" class="todo-new-dropdown-toggle" data-tb-board-toggle aria-haspopup="listbox" aria-expanded="false"><span class="todo-new-dropdown-label">' + escape(selectedBoard.icon + ' ' + selectedBoard.name) + '</span><span class="todo-new-dropdown-caret">▾</span></button>' +
            '<ul class="todo-new-dropdown-list" role="listbox" hidden>' + boardOptions + '</ul>' +
            '<input type="hidden" name="boardId" value="' + escape(selectedBoard.id) + '">' +
          '</div>' +
        '</div>' +
        '<label class="todo-new-field">任务名称<input type="text" name="title" maxlength="120" placeholder="要做什么？" value="' + escape(editingItem?.title || '') + '" required aria-label="任务名称"></label>' +
        '<label class="todo-new-field">链接（可选）<input type="url" name="url" placeholder="https://…" value="' + escape(editingItem?.url || '') + '" aria-label="任务链接"></label>' +
        '<label class="todo-new-field">备注（可选）<textarea name="note" rows="2" maxlength="500" placeholder="补充说明" aria-label="任务备注">' + escape(editingItem?.note || '') + '</textarea></label>' +
        '<div class="todo-date-fields">' +
          '<label>目标日期<input type="date" name="date" value="' + escape(editingItem?.date || todayStr()) + '" required aria-label="目标日期"></label>' +
          '<span class="todo-new-field-spacer" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="todo-modal-actions"><button type="button" class="todo-modal-secondary" data-tb-modal-close>取消</button><button type="submit" class="todo-modal-primary">' + submitLabel + '</button></div>' +
      '</form>' +
    '</section>';
}


// 阶段按「切割点」编辑：日期任务填结束日期，小时任务填结束时刻；
// 下一段自动承接前一段，末段自动收在计划结束边界，阶段之间始终无缝。
function renderPhaseModal(): string {
  const item = itemById(phaseItemId);
  if (!item) return '';
  const plannedStart = item.plannedStart || todayStr();
  const plannedEnd = item.plannedEnd || plannedStart;
  const plannedStartTime = item.plannedStartTime;
  const plannedEndTime = item.plannedEndTime;
  const hourly = isHourlyPhasePlan(plannedStart, plannedEnd, plannedStartTime, plannedEndTime);
  if (!phaseDraft) {
    const normalized = normalizePhases(plannedStart, plannedEnd, item.phases, plannedStartTime, plannedEndTime);
    phaseDraft = normalized && normalized.length > 0
      ? normalized.map((phase) => ({ ...phase }))
      : [{
        id: 'p1', title: '阶段 1', start: plannedStart, end: plannedEnd,
        ...(hourly ? { startTime: plannedStartTime, endTime: plannedEndTime } : {}),
        status: 'todo' as TodoPhaseStatus,
      }];
  }
  const phases = phaseDraft;
  const startAt = parseScheduledDateTime(plannedStart, plannedStartTime);
  const endAt = parseScheduledDateTime(plannedEnd, plannedEndTime);
  const totalUnits = hourly && startAt && endAt
    ? hourDiff(startAt, endAt)
    : Math.max(1, dateDiff(parseDate(plannedStart) || new Date(), parseDate(plannedEnd) || new Date()) + 1);
  const canAdd = phases.length < totalUnits;

  const rows = phases.map((phase, index) => {
    const isLast = index === phases.length - 1;
    const statusOptions = (['todo', 'doing', 'done'] as TodoPhaseStatus[]).map((value) => {
      const label = value === 'todo' ? '未开始' : value === 'doing' ? '进行中' : '已完成';
      return '<option value="' + value + '"' + (phase.status === value ? ' selected' : '') + '>' + label + '</option>';
    }).join('');
    const phaseEndValue = phase.end + 'T' + (phase.endTime || plannedEndTime || '00:00');
    const hourField = isLast
      ? '<span class="todo-phase-end-static" title="末阶段自动延伸到计划结束时刻">至 ' + escape(shortDate(plannedEnd) + ' ' + (plannedEndTime || '')) + '</span>'
      : '<input type="datetime-local" name="phaseEndDateTime" step="3600" value="' + escape(phaseEndValue) + '" min="' + escape(plannedStart + 'T' + (plannedStartTime || '00:00')) + '" max="' + escape(plannedEnd + 'T' + (plannedEndTime || '23:00')) + '" required aria-label="阶段结束时刻">';
    const dateField = isLast
      ? '<span class="todo-phase-end-static" title="末阶段自动延伸到计划结束日">至 ' + escape(shortDate(plannedEnd)) + '</span>'
      : '<input type="date" name="phaseEnd" value="' + escape(phase.end) + '" min="' + escape(plannedStart) + '" max="' + escape(plannedEnd) + '" required aria-label="阶段结束日期">';
    return '<div class="todo-phase-row' + (hourly ? ' is-hourly' : '') + '" data-phase-row="' + escape(phase.id) + '">' +
      '<span class="todo-phase-index">' + (index + 1) + '</span>' +
      '<input type="text" name="phaseTitle" value="' + escape(phase.title) + '" maxlength="40" placeholder="阶段名称" aria-label="阶段名称" required>' +
      '<span class="todo-phase-until">至</span>' + (hourly ? hourField : dateField) +
      '<select name="phaseStatus" aria-label="阶段状态">' + statusOptions + '</select>' +
      '<button type="button" class="todo-phase-remove" data-tb-phase-remove="' + escape(phase.id) + '" aria-label="删除阶段：' + escape(phase.title) + '"' + (phases.length <= 1 ? ' disabled' : '') + '>✕</button>' +
    '</div>';
  }).join('');

  return '<div class="todo-modal-backdrop" data-tb-modal-close></div>' +
    '<section class="todo-modal todo-modal-phases" role="dialog" aria-modal="true" aria-labelledby="todo-phase-title">' +
      '<div class="todo-modal-header"><div><span class="todo-modal-kicker">划分任务阶段</span><h2 id="todo-phase-title">' + escape(item.title) + '</h2></div><button type="button" class="todo-modal-close" data-tb-modal-close aria-label="关闭">✕</button></div>' +
      '<form data-tb-phase-form data-task-id="' + escape(item.id) + '" data-planned-start="' + escape(plannedStart) + '" data-planned-end="' + escape(plannedEnd) + '" data-planned-start-time="' + escape(plannedStartTime || '') + '" data-planned-end-time="' + escape(plannedEndTime || '') + '" data-phase-granularity="' + (hourly ? 'hour' : 'day') + '">' +
        '<p class="todo-modal-help">计划区间 ' + escape(hourly ? shortDate(plannedStart) + ' ' + plannedStartTime + ' — ' + shortDate(plannedEnd) + ' ' + plannedEndTime + '（共 ' + totalUnits + ' 小时）' : shortDate(plannedStart) + ' — ' + shortDate(plannedEnd) + '（共 ' + totalUnits + ' 天）') + '。阶段连续铺满整段，末阶段自动收在结束' + (hourly ? '时刻' : '日') + '。</p>' +
        '<div class="todo-phase-list">' + rows + '</div>' +
        '<div class="todo-phase-tools"><button type="button" class="todo-phase-add" data-tb-phase-add' + (canAdd ? '' : ' disabled') + '>＋ 添加阶段</button><button type="button" class="todo-phase-even" data-tb-phase-even>平均分配</button></div>' +
        '<div class="todo-modal-actions"><button type="button" class="todo-modal-secondary" data-tb-phase-clear>清除阶段</button><button type="button" class="todo-modal-secondary" data-tb-modal-close>取消</button><button type="submit" class="todo-modal-primary">保存阶段</button></div>' +
      '</form>' +
    '</section>';
}

function renderStats(): string {
  const stats = boardStats();
  return '<div class="todo-board-stats"><span class="todo-board-stats-text">总 ' + stats.total + ' · 已完成 ' + stats.done + '</span><div class="todo-board-stats-bar"><div class="todo-board-stats-fill" style="width: ' + stats.rate + '%"></div></div></div>';
}

function renderColumn(status: 'todo' | 'doing' | 'done', label: string, statusClass: string, items: TodoItem[], suffix: string): string {
  const emptyText = status === 'todo' ? '📥 暂无待办' : status === 'doing' ? '🚀 暂无进行中' : '✅ 等待你完成第一个任务';
  // 「进行中」卡片带排期/阶段进度条，单卡更高，每页少放一条，避免整列被拉高。
  const pageSize = status === 'doing' ? 3 : BOARD_PAGE_SIZE;
  const pageKey = activeTabId + ':' + status;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(boardPages[pageKey] || 0, pageCount - 1);
  boardPages[pageKey] = page;
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);
  const cards = items.length > 0 ? pageItems.map(renderCard).join('') : '<p class="todo-board-empty">' + emptyText + '</p>';
  const pagination = pageCount > 1
    ? '<div class="todo-board-pagination"><button type="button" data-tb-page="prev" data-tb-status="' + status + '"' + (page === 0 ? ' disabled' : '') + '>上一页</button><span>' + (page + 1) + ' / ' + pageCount + '</span><button type="button" data-tb-page="next" data-tb-status="' + status + '"' + (page === pageCount - 1 ? ' disabled' : '') + '>下一页</button></div>'
    : '';
  return '<div class="todo-board-column"><div class="todo-board-column-header ' + statusClass + '"><span class="todo-board-column-dot"></span>' + label + ' <span class="todo-board-column-count">' + items.length + suffix + '</span></div><div class="todo-board-column-body">' + cards + '</div>' + pagination + '</div>';
}

function renderColumns(): string {
  const todo = todoItems();
  const doing = doingItems();
  const done = doneItems();
  const total = todo.length + doing.length + done.length;
  return '<div class="todo-board-columns">' +
    renderColumn('todo', '待办', 'todo-status-todo', todo, '') +
    renderColumn('doing', '进行中', 'todo-status-doing', doing, '') +
    renderColumn('done', '已完成', 'todo-status-done', done, '/' + total) +
  '</div>';
}

function renderBoard(): string {
  const boardsLoaded = Array.isArray(window.__TODO_BOARDS);
  const modeBadge = isEditable()
    ? ''
    : '<span class="todo-board-mode-badge" title="任务状态保存在仓库中，本地运行 npm run dev 后即可编辑">🔒 线上只读</span>';
  const addButton = isEditable()
    ? '<button type="button" class="todo-board-add" data-tb-add-new>➕ 新增任务</button>'
    : '';
  const header = '<header class="todo-board-header"><div class="todo-board-date"><span class="todo-board-date-icon">📅</span><span class="todo-board-date-text">' + escape(todayStr()) + '（今天）</span>' + modeBadge + '</div><div class="todo-board-header-actions">' + addButton + renderViewSwitch() + '<button class="todo-board-history-toggle" type="button" data-tb-history>📜 查看历史 ' + (historyOpen ? '▴' : '▾') + '</button></div></header>';
  if (!boardsLoaded) return header + '<div class="todo-board-empty">看板数据未加载。请检查 todo-data.ts 是否正常编译。</div>';
  return header + renderStats() + (historyOpen ? renderHeatmap() : '') + (currentView === 'gantt' ? renderGantt() : renderColumns()) + renderScheduleModal() + renderCompletionModal() + renderPhaseModal() + renderNewItemModal();
}

function refresh() {
  const container = document.getElementById('todoBoard');
  if (container) container.innerHTML = renderBoard();
}

interface GanttDragState {
  itemId: string;
  mode: 'move' | 'resize-start' | 'resize-end';
  bar: HTMLButtonElement;
  startX: number;
  dayWidth: number;
  rangeStart: Date;
  originalStart: Date;
  originalEnd: Date;
}

let ganttDragState: GanttDragState | null = null;

interface PhaseSeamDragState {
  itemId: string;
  // 分割缝左侧阶段的索引：拖动只在 phases[seamIndex] 与 phases[seamIndex + 1] 之间重新分配天数。
  seamIndex: number;
  bar: HTMLElement;
  startX: number;
  dayWidth: number;
  totalSpan: number;
  // 左阶段在任务条网格里的起始列（--phase-start 口径，相对任务条起点）。
  // 预览坐标必须从任务条起点算起；只有第一道缝的左阶段恰好从第 1 列开始，
  // 直接用 leftSpanDays 才碰巧正确，其余缝都会错位重叠。
  leftStartColumn: number;
  leftStart: string;
  leftEnd: string;
  rightEnd: string;
  phasesSnapshot: TodoPhase[];
  lastLeftEnd: string;
}

let seamDragState: PhaseSeamDragState | null = null;

// 分割缝可移动的区间：左阶段至少 1 天、右阶段至少 1 天，下游阶段完全不参与。
function clampSeamEnd(state: PhaseSeamDragState, candidate: Date): Date {
  const leftStart = parseDate(state.leftStart) || candidate;
  const rightEnd = parseDate(state.rightEnd) || candidate;
  const minEnd = leftStart;
  const maxEnd = addDays(rightEnd, -1);
  if (candidate < minEnd) return new Date(minEnd);
  if (candidate > maxEnd) return new Date(maxEnd);
  return candidate;
}

function applySeamPreview(state: PhaseSeamDragState, nextLeftEnd: Date): void {
  const leftStart = parseDate(state.leftStart) || nextLeftEnd;
  const rightEnd = parseDate(state.rightEnd) || nextLeftEnd;
  const leftSpanDays = Math.max(1, dateDiff(leftStart, nextLeftEnd) + 1);
  const rightStart = addDays(nextLeftEnd, 1);
  const rightSpanDays = Math.max(1, dateDiff(rightStart, rightEnd) + 1);
  // 右阶段与分割缝的列号都以任务条起点为原点：左阶段起始列 + 左阶段新宽度。
  const rightStartColumn = state.leftStartColumn + leftSpanDays;
  const track = state.bar.querySelector<HTMLElement>('.todo-gantt-phases');
  if (!track) return;
  const leftCell = track.querySelector<HTMLElement>('[data-phase-index="' + state.seamIndex + '"]');
  const rightCell = track.querySelector<HTMLElement>('[data-phase-index="' + (state.seamIndex + 1) + '"]');
  const seam = track.querySelector<HTMLElement>('[data-seam-index="' + state.seamIndex + '"]');
  if (leftCell) {
    leftCell.style.setProperty('--phase-span', String(leftSpanDays));
    leftCell.dataset.phasePeriod = shortDate(state.leftStart) + '—' + shortDate(fmtDate(nextLeftEnd));
  }
  if (rightCell) {
    rightCell.style.setProperty('--phase-start', String(rightStartColumn));
    rightCell.style.setProperty('--phase-span', String(rightSpanDays));
    rightCell.dataset.phasePeriod = shortDate(fmtDate(rightStart)) + '—' + shortDate(state.rightEnd);
  }
  if (seam) {
    seam.style.left = (((rightStartColumn - 1) / state.totalSpan) * 100).toFixed(4) + '%';
  }
  state.lastLeftEnd = fmtDate(nextLeftEnd);
}

function startSeamDrag(seam: HTMLElement, bar: HTMLElement, event: PointerEvent): void {
  const itemId = seam.dataset.seamItem;
  const seamIndex = Number(seam.dataset.seamIndex);
  if (!itemId || Number.isNaN(seamIndex)) return;
  const item = itemById(itemId);
  const phases = item?.phases;
  if (!phases || !phases[seamIndex] || !phases[seamIndex + 1]) return;
  const track = bar.closest<HTMLElement>('.todo-gantt-track');
  const grid = bar.closest<HTMLElement>('.todo-gantt-grid');
  const dayCount = Number(grid?.dataset.ganttDays || 0);
  if (!track || !dayCount) return;
  const dayWidth = track.getBoundingClientRect().width / dayCount;
  if (!dayWidth) return;
  const totalSpan = Number((bar.style.getPropertyValue('--todo-gantt-span')) || 0) || 1;
  const left = phases[seamIndex];
  const right = phases[seamIndex + 1];
  // 左阶段的起始列：相对任务条起点的天数，预览阶段格子与分割缝位置都依赖它。
  const barStart = parseDate(item.plannedStart) || parseDate(phases[0].start) || parseDate(left.start);
  const leftPhaseStart = parseDate(left.start);
  const leftStartColumn = barStart && leftPhaseStart ? Math.max(1, dateDiff(barStart, leftPhaseStart) + 1) : 1;
  seamDragState = {
    itemId,
    seamIndex,
    bar,
    startX: event.clientX,
    dayWidth,
    totalSpan,
    leftStartColumn,
    leftStart: left.start,
    leftEnd: left.end,
    rightEnd: right.end,
    phasesSnapshot: phases.map((phase) => ({ ...phase })),
    lastLeftEnd: left.end,
  };
  bar.classList.add('is-resizing');
  event.preventDefault();
}

function updateSeamDragPreview(clientX: number): void {
  if (!seamDragState) return;
  const delta = Math.round((clientX - seamDragState.startX) / seamDragState.dayWidth);
  const originalEnd = parseDate(seamDragState.leftEnd);
  if (!originalEnd) return;
  const nextLeftEnd = clampSeamEnd(seamDragState, addDays(originalEnd, delta));
  applySeamPreview(seamDragState, nextLeftEnd);
}

function finishSeamDrag(): void {
  if (!seamDragState) return;
  const state = seamDragState;
  state.bar.classList.remove('is-resizing');
  seamDragState = null;
  hidePhaseTooltip();
  if (state.lastLeftEnd !== state.leftEnd) {
    const next = state.phasesSnapshot.map((phase) => ({ ...phase }));
    const left = next[state.seamIndex];
    const right = next[state.seamIndex + 1];
    if (left && right) {
      left.end = state.lastLeftEnd;
      right.start = fmtDate(addDays(parseDate(state.lastLeftEnd) || new Date(), 1));
      const item = itemById(state.itemId);
      updateItemPhases(state.itemId, normalizePhases(item?.plannedStart, item?.plannedEnd, next));
    }
  }
  refresh();
}

interface HourPhaseSeamDragState {
  itemId: string;
  seamIndex: number;
  bar: HTMLElement;
  startX: number;
  hourWidth: number;
  totalSpan: number;
  leftStartColumn: number;
  leftStart: Date;
  leftEnd: Date;
  rightEnd: Date;
  phasesSnapshot: TodoPhase[];
  lastLeftEnd: Date;
}

let hourPhaseSeamDragState: HourPhaseSeamDragState | null = null;

function clampHourSeamEnd(state: HourPhaseSeamDragState, candidate: Date): Date {
  const minEnd = addHours(state.leftStart, 1);
  const maxEnd = addHours(state.rightEnd, -1);
  if (candidate < minEnd) return minEnd;
  if (candidate > maxEnd) return maxEnd;
  return candidate;
}

function hourPhasePeriod(start: Date, end: Date): string {
  return shortDate(fmtDate(start)) + ' ' + hourKey(start) + '—' + shortDate(fmtDate(end)) + ' ' + hourKey(end);
}

function applyHourSeamPreview(state: HourPhaseSeamDragState, nextLeftEnd: Date): void {
  const leftSpan = Math.max(1, hourDiff(state.leftStart, nextLeftEnd));
  const rightStart = nextLeftEnd;
  const rightSpan = Math.max(1, hourDiff(rightStart, state.rightEnd));
  const rightStartColumn = state.leftStartColumn + leftSpan;
  const phasesTrack = state.bar.querySelector<HTMLElement>('.todo-hour-gantt-phases');
  if (!phasesTrack) return;
  const leftCell = phasesTrack.querySelector<HTMLElement>('[data-phase-index="' + state.seamIndex + '"]');
  const rightCell = phasesTrack.querySelector<HTMLElement>('[data-phase-index="' + (state.seamIndex + 1) + '"]');
  const seam = phasesTrack.querySelector<HTMLElement>('[data-seam-index="' + state.seamIndex + '"]');
  if (leftCell) {
    leftCell.style.setProperty('--phase-span', String(leftSpan));
    leftCell.dataset.phasePeriod = hourPhasePeriod(state.leftStart, nextLeftEnd);
  }
  if (rightCell) {
    rightCell.style.setProperty('--phase-start', String(rightStartColumn));
    rightCell.style.setProperty('--phase-span', String(rightSpan));
    rightCell.dataset.phasePeriod = hourPhasePeriod(rightStart, state.rightEnd);
  }
  if (seam) seam.style.left = (((rightStartColumn - 1) / state.totalSpan) * 100).toFixed(4) + '%';
  state.lastLeftEnd = nextLeftEnd;
}

function startHourSeamDrag(seam: HTMLElement, bar: HTMLElement, event: PointerEvent): void {
  const itemId = seam.dataset.seamItem;
  const seamIndex = Number(seam.dataset.seamIndex);
  if (!itemId || Number.isNaN(seamIndex)) return;
  const item = itemById(itemId);
  const phases = item?.phases;
  if (!item || !phases || !phases[seamIndex] || !phases[seamIndex + 1]) return;
  const track = bar.closest<HTMLElement>('.todo-hour-gantt-track');
  const grid = bar.closest<HTMLElement>('.todo-hour-gantt-grid');
  const hourCount = Number(grid?.dataset.ganttHours || 0);
  if (!track || !hourCount) return;
  const hourWidth = track.getBoundingClientRect().width / hourCount;
  const taskStart = parseScheduledDateTime(item.plannedStart, item.plannedStartTime);
  const leftStart = phaseDateTime(phases[seamIndex], 'start');
  const leftEnd = phaseDateTime(phases[seamIndex], 'end');
  const rightEnd = phaseDateTime(phases[seamIndex + 1], 'end');
  if (!hourWidth || !taskStart || !leftStart || !leftEnd || !rightEnd) return;
  hourPhaseSeamDragState = {
    itemId,
    seamIndex,
    bar,
    startX: event.clientX,
    hourWidth,
    totalSpan: Number(bar.style.getPropertyValue('--todo-gantt-span')) || 1,
    leftStartColumn: Math.max(1, hourDiff(taskStart, leftStart) + 1),
    leftStart,
    leftEnd,
    rightEnd,
    phasesSnapshot: phases.map((phase) => ({ ...phase })),
    lastLeftEnd: leftEnd,
  };
  bar.classList.add('is-resizing');
  event.preventDefault();
}

function updateHourSeamDragPreview(clientX: number): void {
  if (!hourPhaseSeamDragState) return;
  const delta = Math.round((clientX - hourPhaseSeamDragState.startX) / hourPhaseSeamDragState.hourWidth);
  applyHourSeamPreview(hourPhaseSeamDragState, clampHourSeamEnd(hourPhaseSeamDragState, addHours(hourPhaseSeamDragState.leftEnd, delta)));
}

function finishHourSeamDrag(): void {
  if (!hourPhaseSeamDragState) return;
  const state = hourPhaseSeamDragState;
  state.bar.classList.remove('is-resizing');
  hourPhaseSeamDragState = null;
  hidePhaseTooltip();
  if (state.lastLeftEnd.getTime() !== state.leftEnd.getTime()) {
    const next = state.phasesSnapshot.map((phase) => ({ ...phase }));
    const left = next[state.seamIndex];
    const right = next[state.seamIndex + 1];
    const item = itemById(state.itemId);
    if (left && right && item) {
      left.end = fmtDate(state.lastLeftEnd);
      left.endTime = hourKey(state.lastLeftEnd);
      right.start = fmtDate(state.lastLeftEnd);
      right.startTime = hourKey(state.lastLeftEnd);
      updateItemPhases(state.itemId, normalizePhases(item.plannedStart, item.plannedEnd, next, item.plannedStartTime, item.plannedEndTime));
    }
  }
  refresh();
}

interface HourGanttDragState {
  itemId: string;
  mode: 'move' | 'resize-start' | 'resize-end';
  bar: HTMLElement;
  startX: number;
  hourWidth: number;
  rangeStart: Date;
  rangeEnd: Date;
  originalStart: Date;
  originalEnd: Date;
}

let hourGanttDragState: HourGanttDragState | null = null;

function shiftHourlyPhases(phases: TodoPhase[], delta: number): TodoPhase[] {
  if (delta === 0) return phases;
  return phases.map((phase) => {
    const start = phaseDateTime(phase, 'start');
    const end = phaseDateTime(phase, 'end');
    if (!start || !end) return phase;
    const nextStart = addHours(start, delta);
    const nextEnd = addHours(end, delta);
    return { ...phase, start: fmtDate(nextStart), end: fmtDate(nextEnd), startTime: hourKey(nextStart), endTime: hourKey(nextEnd) };
  });
}

function constrainHourTaskRange(state: HourGanttDragState, start: Date, end: Date): { start: Date; end: Date } {
  let nextStart = new Date(start);
  let nextEnd = new Date(end);
  if (state.mode === 'move') {
    const duration = hourDiff(state.originalStart, state.originalEnd);
    if (nextStart < state.rangeStart) {
      nextStart = new Date(state.rangeStart);
      nextEnd = addHours(nextStart, duration);
    }
    if (nextEnd > state.rangeEnd) {
      nextEnd = new Date(state.rangeEnd);
      nextStart = addHours(nextEnd, -duration);
    }
    return { start: nextStart, end: nextEnd };
  }
  if (state.mode === 'resize-start') {
    if (nextStart < state.rangeStart) nextStart = new Date(state.rangeStart);
    if (nextStart >= nextEnd) nextStart = addHours(nextEnd, -1);
  } else {
    if (nextEnd > state.rangeEnd) nextEnd = new Date(state.rangeEnd);
    if (nextEnd <= nextStart) nextEnd = addHours(nextStart, 1);
  }
  return { start: nextStart, end: nextEnd };
}

function updateHourGanttDragPreview(clientX: number): void {
  if (!hourGanttDragState) return;
  const delta = Math.round((clientX - hourGanttDragState.startX) / hourGanttDragState.hourWidth);
  let start = new Date(hourGanttDragState.originalStart);
  let end = new Date(hourGanttDragState.originalEnd);
  if (hourGanttDragState.mode === 'move') {
    start = addHours(start, delta);
    end = addHours(end, delta);
  } else if (hourGanttDragState.mode === 'resize-start') {
    start = addHours(start, delta);
  } else {
    end = addHours(end, delta);
  }
  const next = constrainHourTaskRange(hourGanttDragState, start, end);
  const startColumn = hourDiff(hourGanttDragState.rangeStart, next.start) + 1;
  const span = Math.max(1, hourDiff(next.start, next.end));
  hourGanttDragState.bar.style.gridColumn = startColumn + ' / span ' + span;
  hourGanttDragState.bar.style.setProperty('--todo-gantt-span', String(span));
  hourGanttDragState.bar.querySelector<HTMLElement>('.todo-hour-gantt-phases')?.style.setProperty('--todo-gantt-span', String(span));
  hourGanttDragState.bar.dataset.start = fmtDate(next.start);
  hourGanttDragState.bar.dataset.startTime = hourKey(next.start);
  hourGanttDragState.bar.dataset.end = fmtDate(next.end);
  hourGanttDragState.bar.dataset.endTime = hourKey(next.end);
  const period = hourGanttDragState.bar.querySelector<HTMLElement>('.todo-hour-gantt-bar-copy small');
  if (period) period.textContent = hourPhasePeriod(next.start, next.end);
}

function finishHourGanttDrag(): void {
  if (!hourGanttDragState) return;
  const { bar, itemId, mode, originalStart } = hourGanttDragState;
  const start = parseScheduledDateTime(bar.dataset.start, bar.dataset.startTime);
  const end = parseScheduledDateTime(bar.dataset.end, bar.dataset.endTime);
  bar.classList.remove('is-dragging', 'is-resizing');
  hourGanttDragState = null;
  if (!start || !end || end <= start) {
    refresh();
    return;
  }
  updateItemSchedule(itemId, fmtDate(start), fmtDate(end), hourKey(start), hourKey(end));
  const existing = todoState.items[itemId]?.phases;
  if (existing && existing.length > 0) {
    let next = existing.map((phase) => ({ ...phase }));
    if (mode === 'move') {
      next = shiftHourlyPhases(next, hourDiff(originalStart, start));
    } else if (mode === 'resize-start' && next[0]) {
      next[0].start = fmtDate(start);
      next[0].startTime = hourKey(start);
    } else if (mode === 'resize-end' && next[next.length - 1]) {
      const last = next[next.length - 1];
      last.end = fmtDate(end);
      last.endTime = hourKey(end);
    }
    updateItemPhases(itemId, normalizePhases(fmtDate(start), fmtDate(end), next, hourKey(start), hourKey(end)));
  }
  refresh();
}

function updateGanttDragPreview(clientX: number): void {
  if (!ganttDragState) return;
  const delta = Math.round((clientX - ganttDragState.startX) / ganttDragState.dayWidth);
  let nextStart = new Date(ganttDragState.originalStart);
  let nextEnd = new Date(ganttDragState.originalEnd);
  if (ganttDragState.mode === 'move') {
    nextStart = addDays(nextStart, delta);
    nextEnd = addDays(nextEnd, delta);
  } else if (ganttDragState.mode === 'resize-start') {
    nextStart = addDays(nextStart, delta);
    if (nextStart > nextEnd) nextStart = new Date(nextEnd);
  } else {
    nextEnd = addDays(nextEnd, delta);
    if (nextEnd < nextStart) nextEnd = new Date(nextStart);
  }
  const startColumn = dateDiff(ganttDragState.rangeStart, nextStart) + 1;
  const span = Math.max(1, dateDiff(nextStart, nextEnd) + 1);
  const startValue = fmtDate(nextStart);
  const endValue = fmtDate(nextEnd);
  ganttDragState.bar.style.gridColumn = startColumn + ' / span ' + span;
  ganttDragState.bar.style.setProperty('--todo-gantt-span', String(span));
  const innerPhases = ganttDragState.bar.querySelector<HTMLElement>('.todo-gantt-phases');
  if (innerPhases) innerPhases.style.setProperty('--todo-gantt-span', String(span));
  ganttDragState.bar.dataset.start = startValue;
  ganttDragState.bar.dataset.end = endValue;
  const period = ganttDragState.bar.querySelector<HTMLElement>('[data-gantt-period]');
  if (period) period.textContent = shortDate(startValue) + '—' + shortDate(endValue);
}

// 自定义阶段浮窗：替代浏览器原生 title，渲染阶段名 / 日期段 / 状态点。
// 共享一个 DOM 节点，根据触发元素 data 属性填充内容，跟随鼠标位置并避免溢出视口。
function ensureTooltip(): HTMLElement {
  let tip = document.querySelector<HTMLElement>('.todo-phase-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'todo-phase-tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
  }
  return tip;
}

function placeTooltip(tip: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const margin = 8;
  const top = window.scrollY + rect.bottom + margin;
  let left = window.scrollX + rect.left + rect.width / 2 - tipRect.width / 2;
  const maxLeft = window.scrollX + window.innerWidth - tipRect.width - margin;
  if (left < margin) left = margin;
  if (left > maxLeft) left = maxLeft;
  tip.style.top = top + 'px';
  tip.style.left = left + 'px';
}

function showPhaseTooltip(anchor: HTMLElement): void {
  const tip = ensureTooltip();
  if (anchor.hasAttribute('data-phase-title')) {
    const title = anchor.dataset.phaseTitle || '';
    const period = anchor.dataset.phasePeriod || '';
    const status = anchor.dataset.phaseStatus || 'todo';
    const statusLabel = anchor.dataset.phaseStatusLabel || '';
    tip.innerHTML =
      '<span class="todo-phase-tooltip-mark is-' + status + '"></span>' +
      '<div class="todo-phase-tooltip-body">' +
        '<strong class="todo-phase-tooltip-title">' + escape(title) + '</strong>' +
        '<span class="todo-phase-tooltip-meta">' +
          '<span class="todo-phase-tooltip-period">' + escape(period) + '</span>' +
          '<span class="todo-phase-tooltip-sep">·</span>' +
          '<span class="todo-phase-tooltip-status is-' + status + '"><i></i>' + escape(statusLabel) + '</span>' +
        '</span>' +
      '</div>';
  } else if (anchor.hasAttribute('data-phase-list')) {
    const list = anchor.dataset.phaseList || '';
    tip.innerHTML = '<div class="todo-phase-tooltip-list">' + escape(list).split(' → ').map((segment) =>
      '<span class="todo-phase-tooltip-segment">' + segment + '</span>'
    ).join('<span class="todo-phase-tooltip-sep">→</span>') + '</div>';
  } else {
    return;
  }
  tip.classList.add('is-visible');
  // 内容刚写入，宽度未定，需要先放出来再测量位置。
  placeTooltip(tip, anchor);
}

function hidePhaseTooltip(): void {
  const tip = document.querySelector<HTMLElement>('.todo-phase-tooltip');
  if (tip) tip.classList.remove('is-visible');
}

let tooltipTimer: ReturnType<typeof window.setTimeout> | undefined;
document.addEventListener('pointerover', (event) => {
  const anchor = (event.target as HTMLElement).closest<HTMLElement>('[data-tb-phase-tooltip]');
  if (!anchor) return;
  if (tooltipTimer) window.clearTimeout(tooltipTimer);
  tooltipTimer = window.setTimeout(() => showPhaseTooltip(anchor), 80);
});
document.addEventListener('pointerout', (event) => {
  const anchor = (event.target as HTMLElement).closest<HTMLElement>('[data-tb-phase-tooltip]');
  if (!anchor) return;
  if (tooltipTimer) window.clearTimeout(tooltipTimer);
  hidePhaseTooltip();
});
window.addEventListener('scroll', hidePhaseTooltip, { passive: true });

document.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement;
  const hourBar = target.closest<HTMLElement>('[data-tb-hour-gantt-bar]');
  if (hourBar) {
    if (!isEditable()) {
      showToast('🔒 线上只读：请在本地 dev（npm run dev）中调整甘特图计划');
      return;
    }
    const hourSeam = target.closest<HTMLElement>('[data-tb-hour-phase-seam]');
    if (hourSeam) {
      startHourSeamDrag(hourSeam, hourBar, event);
      return;
    }
    const itemId = hourBar.dataset.taskId;
    const originalStart = parseScheduledDateTime(hourBar.dataset.start, hourBar.dataset.startTime);
    const originalEnd = parseScheduledDateTime(hourBar.dataset.end, hourBar.dataset.endTime);
    const grid = hourBar.closest<HTMLElement>('.todo-hour-gantt-grid');
    const track = hourBar.closest<HTMLElement>('.todo-hour-gantt-track');
    const rangeStart = parseScheduledDateTime(grid?.dataset.rangeStart, grid?.dataset.rangeStartTime);
    const rangeEnd = parseScheduledDateTime(grid?.dataset.rangeEnd, grid?.dataset.rangeEndTime);
    const hourCount = Number(grid?.dataset.ganttHours || 0);
    if (!itemId || !originalStart || !originalEnd || !grid || !track || !rangeStart || !rangeEnd || !hourCount) return;
    const hourWidth = track.getBoundingClientRect().width / hourCount;
    if (!hourWidth) return;
    const edge = target.closest<HTMLElement>('[data-hour-gantt-edge]')?.dataset.hourGanttEdge;
    hourGanttDragState = {
      itemId,
      mode: edge === 'start' ? 'resize-start' : edge === 'end' ? 'resize-end' : 'move',
      bar: hourBar,
      startX: event.clientX,
      hourWidth,
      rangeStart,
      rangeEnd,
      originalStart,
      originalEnd,
    };
    hourBar.classList.add(edge ? 'is-resizing' : 'is-dragging');
    event.preventDefault();
    return;
  }
  const bar = target.closest<HTMLButtonElement>('[data-tb-gantt-bar]');
  if (!bar) return;
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中调整甘特图计划');
    return;
  }
  // 分割缝优先：它落在阶段交界处，拖动只影响左右两个相邻阶段。
  const seam = target.closest<HTMLElement>('[data-tb-phase-seam]');
  if (seam) {
    startSeamDrag(seam, bar, event);
    return;
  }
  const itemId = bar.dataset.taskId;
  const originalStart = parseDate(bar.dataset.start);
  const originalEnd = parseDate(bar.dataset.end);
  const grid = bar.closest<HTMLElement>('.todo-gantt-grid');
  const track = bar.closest<HTMLElement>('.todo-gantt-track');
  if (!itemId || !originalStart || !originalEnd || !grid || !track) return;
  const rangeStart = parseDate(grid.dataset.rangeStart);
  const dayCount = Number(grid.dataset.ganttDays || 0);
  if (!rangeStart || !dayCount) return;
  const dayWidth = track.getBoundingClientRect().width / dayCount;
  if (!dayWidth) return;
  const edge = target.closest<HTMLElement>('[data-gantt-edge]')?.dataset.ganttEdge;
  ganttDragState = {
    itemId,
    mode: edge === 'start' ? 'resize-start' : edge === 'end' ? 'resize-end' : 'move',
    bar,
    startX: event.clientX,
    dayWidth,
    rangeStart,
    originalStart,
    originalEnd,
  };
  bar.classList.add('is-dragging');
  event.preventDefault();
});

document.addEventListener('pointermove', (event) => {
  if (hourPhaseSeamDragState) {
    event.preventDefault();
    updateHourSeamDragPreview(event.clientX);
    return;
  }
  if (hourGanttDragState) {
    event.preventDefault();
    updateHourGanttDragPreview(event.clientX);
    return;
  }
  if (seamDragState) {
    event.preventDefault();
    updateSeamDragPreview(event.clientX);
    return;
  }
  if (!ganttDragState) return;
  event.preventDefault();
  updateGanttDragPreview(event.clientX);
});

function finishGanttDrag(): void {
  if (!ganttDragState) return;
  const { bar, itemId, mode, originalStart, originalEnd } = ganttDragState;
  const start = bar.dataset.start;
  const end = bar.dataset.end;
  bar.classList.remove('is-dragging');
  ganttDragState = null;
  if (!start || !end) {
    refresh();
    return;
  }
  // 在按天轴拖拽意味着回到日期级排期，清除具体时间，避免日期调整后出现倒置的小时区间。
  updateItemSchedule(itemId, start, end);

  // 阶段跟着计划区间走：整条移动时整体平移，拉伸两端时只动首/末阶段的边界。
  const existing = todoState.items[itemId]?.phases;
  if (existing && existing.length > 0) {
    const delta = dateDiff(originalStart, parseDate(start) || originalStart);
    let nextPhases = existing;
    if (mode === 'move') {
      nextPhases = shiftPhases(existing, delta);
    } else {
      nextPhases = existing.map((phase, index) => {
        if (mode === 'resize-start' && index === 0) {
          return { ...phase, start, end: phase.end < start ? start : phase.end };
        }
        if (mode === 'resize-end' && index === existing.length - 1) {
          return { ...phase, end, start: phase.start > end ? end : phase.start };
        }
        return phase;
      });
    }
    updateItemPhases(itemId, normalizePhases(start, end, nextPhases));
  }
  refresh();
}

function removeFromGantt(itemId: string): void {
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中修改任务状态');
    return;
  }
  const patch = { ...(todoState.items[itemId] || {}) };
  // date 和 createdAt 属于静态任务资料，不在状态补丁中，移出时保持原值。
  delete patch.plannedStart;
  delete patch.plannedEnd;
  delete patch.plannedStartTime;
  delete patch.plannedEndTime;
  delete patch.completedAt;
  // 阶段依附于计划区间，没有排期就没有阶段。
  delete patch.phases;
  patch.status = 'todo';
  todoState.items[itemId] = patch;
  pushTodoState();
}

// 「退回待办」只撤销完成状态：保留排期和阶段，方便用户继续按原计划返工。
function returnToTodo(itemId: string): void {
  if (!isEditable()) {
    showToast('🔒 线上只读：请在本地 dev（npm run dev）中修改任务状态');
    return;
  }
  const item = itemById(itemId);
  if (!item || item.archived) return;
  const patch = { ...(todoState.items[itemId] || {}) };
  delete patch.completedAt;
  patch.status = 'todo';
  todoState.items[itemId] = patch;
  pushTodoState();
}

function finishAnyGanttDrag(): void {
  if (hourPhaseSeamDragState) {
    finishHourSeamDrag();
    return;
  }
  if (hourGanttDragState) {
    finishHourGanttDrag();
    return;
  }
  if (seamDragState) {
    finishSeamDrag();
    return;
  }
  finishGanttDrag();
}

document.addEventListener('pointerup', finishAnyGanttDrag);
document.addEventListener('pointercancel', finishAnyGanttDrag);

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const viewButton = target.closest<HTMLButtonElement>('[data-tb-view]');
  if (viewButton) {
    currentView = viewButton.dataset.tbView === 'gantt' ? 'gantt' : 'board';
    scheduleItemId = null;
    completionItemId = null;
    refresh();
    return;
  }

  const ganttScaleButton = target.closest<HTMLButtonElement>('[data-tb-gantt-scale]');
  if (ganttScaleButton) {
    ganttGranularity = ganttScaleButton.dataset.tbGanttScale === 'hour' ? 'hour' : 'day';
    refresh();
    return;
  }

  // 自定义下拉：点击下拉外部时收起展开的选项列表。
  if (!target.closest('[data-new-board-dropdown]')) {
    document.querySelectorAll<HTMLElement>('[data-new-board-dropdown] .todo-new-dropdown-list:not([hidden])').forEach((list) => {
      list.hidden = true;
      const toggle = list.closest('.todo-new-dropdown')?.querySelector<HTMLButtonElement>('[data-tb-board-toggle]');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  }

  const boardToggle = target.closest<HTMLButtonElement>('[data-tb-board-toggle]');
  if (boardToggle) {
    const list = boardToggle.closest('.todo-new-dropdown')?.querySelector<HTMLElement>('.todo-new-dropdown-list');
    if (list) {
      list.hidden = !list.hidden;
      boardToggle.setAttribute('aria-expanded', list.hidden ? 'false' : 'true');
    }
    return;
  }

  const boardOption = target.closest<HTMLElement>('[data-board-option]');
  if (boardOption) {
    const dropdown = boardOption.closest<HTMLElement>('[data-new-board-dropdown]');
    if (dropdown) {
      const hiddenInput = dropdown.querySelector<HTMLInputElement>('input[name="boardId"]');
      if (hiddenInput) hiddenInput.value = boardOption.dataset.boardOption || '';
      const label = dropdown.querySelector<HTMLElement>('.todo-new-dropdown-label');
      if (label) label.textContent = boardOption.textContent?.trim() || hiddenInput?.value || '';
      dropdown.querySelectorAll<HTMLElement>('[data-board-option]').forEach((option) => {
        const selected = option === boardOption;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      const list = dropdown.querySelector<HTMLElement>('.todo-new-dropdown-list');
      if (list) list.hidden = true;
      dropdown.querySelector<HTMLButtonElement>('[data-tb-board-toggle]')?.setAttribute('aria-expanded', 'false');
    }
    return;
  }

  const addNewButton = target.closest<HTMLButtonElement>('[data-tb-add-new]');
  if (addNewButton) {
    newItemOpen = true;
    editItemId = null;
    scheduleItemId = null;
    completionItemId = null;
    phaseItemId = null;
    refresh();
    return;
  }

  const editButton = target.closest<HTMLButtonElement>('[data-tb-edit]');
  if (editButton) {
    const itemId = editButton.dataset.tbEdit;
    const item = itemById(itemId || null);
    if (!item || item.archived) return;
    editItemId = item.id;
    newItemOpen = true;
    scheduleItemId = null;
    completionItemId = null;
    phaseItemId = null;
    refresh();
    return;
  }

  const deleteButton = target.closest<HTMLButtonElement>('[data-tb-delete]');
  if (deleteButton) {
    const itemId = deleteButton.dataset.tbDelete;
    if (itemId) {
      if (!isEditable()) {
        showToast('🔒 线上只读：请在本地 dev（npm run dev）中删除任务');
        return;
      }
      const item = itemById(itemId);
      if (!item || item.archived) return;
      if (!window.confirm('确定删除「' + item.title + '」？将从 todo-data.ts 中移除，不可恢复。')) return;
      fetch('/__todo_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id: itemId }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const result = await response.json() as { found?: boolean };
          if (!result.found) throw new Error('not found');
          // 自写盘的 HMR 广播被抑制，内存里的看板数据手动同步，UI 立即一致。
          boards().forEach((board) => {
            board.items = board.items.filter((boardItem) => boardItem.id !== itemId);
          });
          showToast('🗑️ 已从 todo-data.ts 删除');
          Object.keys(boardPages).forEach((key) => delete boardPages[key]);
          refresh();
        })
        .catch(() => showToast('⚠️ 删除失败：请确认本地 dev server 正在运行（npm run dev）'));
    }
    return;
  }

  const scheduleButton = target.closest<HTMLButtonElement>('[data-tb-schedule]');
  if (scheduleButton) {
    scheduleItemId = scheduleButton.dataset.tbSchedule || null;
    completionItemId = null;
    refresh();
    return;
  }

  const completeButton = target.closest<HTMLButtonElement>('[data-tb-complete]');
  if (completeButton) {
    const itemId = completeButton.dataset.tbComplete;
    if (itemId) {
      updateItemState(itemId, { status: 'done', completedAt: todayStr() });
      Object.keys(boardPages).forEach((key) => delete boardPages[key]);
      refresh();
    }
    return;
  }

  const returnToTodoButton = target.closest<HTMLButtonElement>('[data-tb-return-todo]');
  if (returnToTodoButton) {
    const itemId = returnToTodoButton.dataset.tbReturnTodo;
    if (itemId) {
      returnToTodo(itemId);
      Object.keys(boardPages).forEach((key) => delete boardPages[key]);
      refresh();
    }
    return;
  }

  const removeGanttButton = target.closest<HTMLButtonElement>('[data-tb-gantt-remove]');
  if (removeGanttButton) {
    const itemId = removeGanttButton.dataset.tbGanttRemove;
    if (itemId) {
      removeFromGantt(itemId);
      currentView = 'board';
      ganttShowCompleted = false;
      Object.keys(boardPages).forEach((key) => delete boardPages[key]);
      refresh();
    }
    return;
  }

  const editCompletedButton = target.closest<HTMLButtonElement>('[data-tb-edit-completed]');
  if (editCompletedButton) {
    completionItemId = editCompletedButton.dataset.tbEditCompleted || null;
    scheduleItemId = null;
    refresh();
    return;
  }

  const phaseOpenButton = target.closest<HTMLButtonElement>('[data-tb-gantt-phases]');
  if (phaseOpenButton) {
    phaseItemId = phaseOpenButton.dataset.tbGanttPhases || null;
    phaseDraft = null;
    scheduleItemId = null;
    completionItemId = null;
    refresh();
    return;
  }

  const phaseAddButton = target.closest<HTMLButtonElement>('[data-tb-phase-add]');
  if (phaseAddButton) {
    syncPhaseDraftFromDom();
    const form = phaseAddButton.closest<HTMLFormElement>('[data-tb-phase-form]');
    const plannedStart = form?.dataset.plannedStart || todayStr();
    const plannedEnd = form?.dataset.plannedEnd || plannedStart;
    const plannedStartTime = form?.dataset.plannedStartTime;
    const plannedEndTime = form?.dataset.plannedEndTime;
    const hourly = form?.dataset.phaseGranularity === 'hour';
    const startAt = parseScheduledDateTime(plannedStart, plannedStartTime);
    const endAt = parseScheduledDateTime(plannedEnd, plannedEndTime);
    const totalUnits = hourly && startAt && endAt
      ? hourDiff(startAt, endAt)
      : Math.max(1, dateDiff(parseDate(plannedStart) || new Date(), parseDate(plannedEnd) || new Date()) + 1);
    if (phaseDraft && phaseDraft.length >= totalUnits) {
      showToast('计划区间只有 ' + totalUnits + (hourly ? ' 小时' : ' 天') + '，放不下更多阶段了');
      return;
    }
    if (phaseDraft && phaseDraft.length > 0) {
      const last = phaseDraft[phaseDraft.length - 1];
      if (hourly) {
        const lastStart = phaseDateTime(last, 'start') || startAt || new Date();
        const lastEnd = phaseDateTime(last, 'end') || endAt || addHours(lastStart, 1);
        const hours = Math.max(1, hourDiff(lastStart, lastEnd));
        const splitAt = hours >= 2 ? addHours(lastStart, Math.floor(hours / 2)) : lastEnd;
        phaseDraft.push({ id: 'p' + Date.now(), title: '新阶段', start: fmtDate(splitAt), end: fmtDate(lastEnd), startTime: hourKey(splitAt), endTime: hourKey(lastEnd), status: 'todo' });
        if (hours >= 2) {
          last.end = fmtDate(splitAt);
          last.endTime = hourKey(splitAt);
        }
        refresh();
        return;
      }
      const lastStart = parseDate(last.start) || parseDate(plannedStart) || new Date();
      const lastEnd = parseDate(last.end) || lastStart;
      const days = Math.max(1, dateDiff(lastStart, lastEnd) + 1);
      // 把末阶段对半分，前面的阶段不受影响。
      const splitAt = days >= 2 ? addDays(lastStart, Math.floor(days / 2)) : lastEnd;
      phaseDraft.push({ id: 'p' + Date.now(), title: '新阶段', start: fmtDate(splitAt), end: fmtDate(lastEnd), status: 'todo' });
      if (days >= 2) last.end = fmtDate(addDays(splitAt, -1));
      refresh();
    }
    return;
  }

  const phaseEvenButton = target.closest<HTMLButtonElement>('[data-tb-phase-even]');
  if (phaseEvenButton) {
    syncPhaseDraftFromDom();
    const form = phaseEvenButton.closest<HTMLFormElement>('[data-tb-phase-form]');
    const plannedStart = form?.dataset.plannedStart;
    const plannedEnd = form?.dataset.plannedEnd;
    if (phaseDraft && plannedStart && plannedEnd) {
      phaseDraft = splitEvenly(phaseDraft, plannedStart, plannedEnd, form?.dataset.plannedStartTime, form?.dataset.plannedEndTime);
      refresh();
    }
    return;
  }

  const phaseRemoveButton = target.closest<HTMLButtonElement>('[data-tb-phase-remove]');
  if (phaseRemoveButton && !phaseRemoveButton.disabled) {
    syncPhaseDraftFromDom();
    const removedId = phaseRemoveButton.dataset.tbPhaseRemove;
    if (phaseDraft && phaseDraft.length > 1 && removedId) {
      phaseDraft = phaseDraft.filter((phase) => phase.id !== removedId);
      refresh();
    }
    return;
  }

  const phaseClearButton = target.closest<HTMLButtonElement>('[data-tb-phase-clear]');
  if (phaseClearButton) {
    const form = phaseClearButton.closest<HTMLFormElement>('[data-tb-phase-form]');
    const itemId = form?.dataset.taskId;
    if (itemId) {
      updateItemPhases(itemId, undefined);
      phaseItemId = null;
      phaseDraft = null;
      refresh();
    }
    return;
  }

  if (target.closest('[data-tb-modal-close]')) {
    scheduleItemId = null;
    completionItemId = null;
    phaseItemId = null;
    phaseDraft = null;
    newItemOpen = false;
    editItemId = null;
    refresh();
    return;
  }

  const pageButton = target.closest<HTMLButtonElement>('[data-tb-page]');
  if (pageButton && !pageButton.disabled) {
    const status = pageButton.dataset.tbStatus || 'todo';
    const pageKey = activeTabId + ':' + status;
    const currentPage = boardPages[pageKey] || 0;
    boardPages[pageKey] = pageButton.dataset.tbPage === 'next' ? currentPage + 1 : Math.max(0, currentPage - 1);
    refresh();
    return;
  }

  const historyButton = target.closest<HTMLButtonElement>('[data-tb-history]');
  if (historyButton) {
    selectedHeatmapDate = null;
    heatmapPage = 0;
    historyOpen = !historyOpen;
    refresh();
    return;
  }

  const heatmapPageButton = target.closest<HTMLButtonElement>('[data-hm-page]');
  if (heatmapPageButton && !heatmapPageButton.disabled) {
    const pageCount = Number(heatmapPageButton.dataset.hmPageCount || 1);
    heatmapPage = heatmapPageButton.dataset.hmPage === 'next'
      ? Math.min(heatmapPage + 1, pageCount - 1)
      : Math.max(0, heatmapPage - 1);
    refresh();
    return;
  }

  const cell = target.closest<HTMLElement>('[data-hm-date]');
  if (cell) {
    const date = cell.dataset.hmDate || null;
    selectedHeatmapDate = selectedHeatmapDate === date ? null : date;
    heatmapPage = 0;
    refresh();
    return;
  }

  if (target.closest('[data-hm-close]')) {
    selectedHeatmapDate = null;
    heatmapPage = 0;
    refresh();
  }
});

document.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement;
  if (!target.matches('[data-tb-gantt-completed]')) return;
  ganttShowCompleted = target.checked;
  refresh();
});

document.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement;
  const newForm = form.closest<HTMLFormElement>('[data-tb-new-form]');
  if (newForm) {
    event.preventDefault();
    if (!isEditable()) {
      showToast('🔒 线上只读：请在本地 dev（npm run dev）中新增任务');
      return;
    }
    const boardId = (newForm.elements.namedItem('boardId') as HTMLInputElement | null)?.value || '';
    const titleInput = newForm.elements.namedItem('title') as HTMLInputElement | null;
    const urlInput = newForm.elements.namedItem('url') as HTMLInputElement | null;
    const noteInput = newForm.elements.namedItem('note') as HTMLTextAreaElement | null;
    const dateInput = newForm.elements.namedItem('date') as HTMLInputElement | null;
    const title = titleInput?.value.trim() || '';
    if (!boardId || !title || !dateInput?.value) return;
    const editingId = newForm.dataset.editingId || '';
    const action = editingId ? 'update' : 'add';
    fetch('/__todo_file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ...(editingId ? { id: editingId } : {}),
        boardId,
        title,
        url: urlInput?.value.trim() || '',
        note: noteInput?.value.trim() || '',
        date: dateInput.value,
        createdAt: todayStr(),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const result = await response.json() as { item: TodoItem & { boardId?: string } };
        // 自写盘的 HMR 广播被抑制，内存里的看板数据手动同步，UI 立即一致。
        const targetBoardId = result.item.boardId || boardId;
        if (editingId) {
          boards().forEach((board) => {
            board.items = board.items.filter((boardItem) => boardItem.id !== editingId);
          });
        }
        const board = boards().find((candidate) => candidate.id === targetBoardId);
        if (board) board.items.push(result.item);
        showToast(editingId ? '✅ 已更新 todo-data.ts（' + result.item.id + '）' : '✅ 已写入 todo-data.ts（' + result.item.id + '）');
        newItemOpen = false;
        editItemId = null;
        Object.keys(boardPages).forEach((key) => delete boardPages[key]);
        refresh();
      })
      .catch(() => showToast('⚠️ 新增失败：请确认本地 dev server 正在运行（npm run dev）'));
    return;
  }

  const scheduleForm = form.closest<HTMLFormElement>('[data-tb-schedule-form]');
  if (scheduleForm) {
    event.preventDefault();
    const startInput = scheduleForm.elements.namedItem('plannedStart') as HTMLInputElement | null;
    const endInput = scheduleForm.elements.namedItem('plannedEnd') as HTMLInputElement | null;
    const startTimeInput = scheduleForm.elements.namedItem('plannedStartTime') as HTMLInputElement | null;
    const endTimeInput = scheduleForm.elements.namedItem('plannedEndTime') as HTMLInputElement | null;
    const itemId = scheduleForm.dataset.taskId;
    if (!startInput || !endInput || !itemId || !startInput.value || !endInput.value) return;
    if (endInput.value < startInput.value) {
      endInput.setCustomValidity('结束日期不能早于开始日期');
      endInput.reportValidity();
      endInput.setCustomValidity('');
      return;
    }
    const startTime = startTimeInput?.value || '';
    const endTime = endTimeInput?.value || '';
    if (Boolean(startTime) !== Boolean(endTime)) {
      const field = startTime ? endTimeInput : startTimeInput;
      field?.setCustomValidity('开始和结束时间需要同时填写，或同时留空');
      field?.reportValidity();
      field?.setCustomValidity('');
      return;
    }
    if (startTime && endTime) {
      if (!isHourKey(startTime) || !isHourKey(endTime)) {
        endTimeInput?.setCustomValidity('小时排期请按整点填写，例如 09:00');
        endTimeInput?.reportValidity();
        endTimeInput?.setCustomValidity('');
        return;
      }
      const startDateTime = parseScheduledDateTime(startInput.value, startTime);
      const endDateTime = parseScheduledDateTime(endInput.value, endTime);
      if (!startDateTime || !endDateTime || endDateTime <= startDateTime) {
        endTimeInput?.setCustomValidity('结束时间必须晚于开始时间');
        endTimeInput?.reportValidity();
        endTimeInput?.setCustomValidity('');
        return;
      }
    }
    updateItemSchedule(itemId, startInput.value, endInput.value, startTime || undefined, endTime || undefined);
    scheduleItemId = null;
    currentView = 'gantt';
    refresh();
    return;
  }

  const completionForm = form.closest<HTMLFormElement>('[data-tb-completion-form]');
  if (completionForm) {
    event.preventDefault();
    const dateInput = completionForm.elements.namedItem('completedAt') as HTMLInputElement | null;
    const itemId = completionForm.dataset.taskId;
    if (!dateInput || !dateInput.value || !itemId) return;
    updateItemState(itemId, { status: 'done', completedAt: dateInput.value });
    completionItemId = null;
    Object.keys(boardPages).forEach((key) => delete boardPages[key]);
    refresh();
    return;
  }

  const phaseForm = form.closest<HTMLFormElement>('[data-tb-phase-form]');
  if (phaseForm) {
    event.preventDefault();
    syncPhaseDraftFromDom();
    const itemId = phaseForm.dataset.taskId;
    const plannedStart = phaseForm.dataset.plannedStart;
    const plannedEnd = phaseForm.dataset.plannedEnd;
    if (!itemId || !phaseDraft || !plannedStart || !plannedEnd) return;
    if (phaseDraft.some((phase) => !phase.title.trim())) {
      showToast('请填写每个阶段的名称');
      return;
    }
    updateItemPhases(itemId, normalizePhases(plannedStart, plannedEnd, phaseDraft, phaseForm.dataset.plannedStartTime, phaseForm.dataset.plannedEndTime));
    phaseItemId = null;
    phaseDraft = null;
    refresh();
  }
});

document.addEventListener('keydown', (event) => {
  const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-hm-date]');
  if (!cell || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  const date = cell.dataset.hmDate || null;
  selectedHeatmapDate = selectedHeatmapDate === date ? null : date;
  heatmapPage = 0;
  refresh();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (selectedHeatmapDate || scheduleItemId || completionItemId || phaseItemId || newItemOpen) {
    selectedHeatmapDate = null;
    heatmapPage = 0;
    scheduleItemId = null;
    completionItemId = null;
    phaseDraft = null;
    phaseItemId = null;
    phaseDraft = null;
    newItemOpen = false;
    editItemId = null;
    refresh();
  }
});

refresh();
migrateLegacyLocalState();
