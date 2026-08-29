import type { TodoBoard, TodoItem } from '../data/todo-data';

declare global {
  interface Window {
    __TODO_BOARDS?: TodoBoard[];
    __ARCHIVED_TODO_BOARDS?: TodoBoard[];
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
};

type TodoStatePatch = Partial<Pick<TodoItem, 'status' | 'plannedStart' | 'plannedEnd' | 'completedAt'>>;

interface TodoLocalState {
  version: 1;
  items: Record<string, TodoStatePatch>;
}

const SUMMARY_BOARD_IDS = ['life', 'coding', 'research'];
const BOARD_PAGE_SIZE = 4;
const TODO_STORAGE_KEY = 'bear-home.todo-board.v1';

let activeTabId = 'summary';
let currentView: 'board' | 'gantt' = 'board';
let historyOpen = false;
let selectedHeatmapDate: string | null = null;
let scheduleItemId: string | null = null;
let completionItemId: string | null = null;
let ganttShowCompleted = false;
const boardPages: Record<string, number> = {};

function loadLocalState(): TodoLocalState {
  try {
    const raw = window.localStorage.getItem(TODO_STORAGE_KEY);
    if (!raw) return { version: 1, items: {} };
    const parsed = JSON.parse(raw) as Partial<TodoLocalState>;
    if (parsed.version === 1 && parsed.items && typeof parsed.items === 'object') {
      return { version: 1, items: parsed.items as Record<string, TodoStatePatch> };
    }
  } catch {
    // localStorage 不可用或数据损坏时，回退到静态任务数据。
  }
  return { version: 1, items: {} };
}

let localState = loadLocalState();

function saveLocalState(): void {
  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(localState));
  } catch {
    // 私有浏览模式等场景下无法写入时，当前页面仍可继续使用。
  }
}

function applyLocalState(item: TodoItem): TodoItem {
  return { ...item, ...(localState.items[item.id] || {}) };
}

function updateItemState(id: string, patch: TodoStatePatch): void {
  localState.items[id] = { ...(localState.items[id] || {}), ...patch };
  saveLocalState();
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
        merged.push({
          ...applyLocalState(item),
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
        merged.push({
          ...applyLocalState(item),
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

  let monthLabels = '';
  let lastMonthKey = '';
  weeks.forEach((week, weekIndex) => {
    const monthStart = week.find((item) => item.date.getDate() === 1);
    const labelDate = monthStart || (weekIndex === 0 ? week[0] : null);
    if (!labelDate) return;
    const monthKey = labelDate.date.getFullYear() + '-' + labelDate.date.getMonth();
    if (monthKey === lastMonthKey) return;
    monthLabels += '<span class="hm-month-label" style="grid-column: ' + (weekIndex + 2) + '">' + monthNames[labelDate.date.getMonth()] + '</span>';
    lastMonthKey = monthKey;
  });

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
      '<div class="hm-months" style="--hm-week-count: ' + weeks.length + '"><span></span>' + monthLabels + '</div>' +
      '<div class="hm-grid" style="--hm-week-count: ' + weeks.length + '" role="grid" aria-label="过去一年的完成记录">' + dayRows + '</div>' +
      '<div class="hm-legend"><span>少</span><span class="hm-cell"></span><span class="hm-cell hm-lvl-1"></span><span class="hm-cell hm-lvl-2"></span><span class="hm-cell hm-lvl-3"></span><span class="hm-cell hm-lvl-4"></span><span>多</span></div>' +
    '</div>' +
    renderDrawer(data) +
  '</section>';
}

function renderDrawer(data: Map<string, HeatmapItem[]>): string {
  if (!selectedHeatmapDate) return '';
  const items = data.get(selectedHeatmapDate) || [];
  const itemHtml = items.length === 0
    ? '<p class="hm-drawer-empty">当日无完成记录</p>'
    : items.map((item) => {
      const title = item.url
        ? '<a href="' + escape(item.url) + '" target="_blank" rel="noopener" class="hm-drawer-link">' + escape(item.title) + '</a>'
        : escape(item.title);
      return '<li class="hm-drawer-item"><span class="hm-drawer-item-badge">' + escape(item.boardIcon) + '</span> ' + title + '</li>';
    }).join('');

  return '<div class="hm-drawer-backdrop" data-hm-close></div>' +
    '<div class="hm-drawer" role="dialog" aria-label="' + escape(selectedHeatmapDate) + ' 完成记录">' +
      '<div class="hm-drawer-header">' +
        '<div class="hm-drawer-date"><span class="hm-drawer-date-value">' + escape(selectedHeatmapDate) + '</span><span class="hm-drawer-date-rel">' + escape(relativeTime(selectedHeatmapDate)) + '</span></div>' +
        '<span class="hm-drawer-count">' + items.length + ' 条</span>' +
        '<button class="hm-drawer-close" data-hm-close aria-label="关闭">✕</button>' +
      '</div>' +
      '<ul class="hm-drawer-list">' + itemHtml + '</ul>' +
    '</div>';
}

function renderCard(item: BoardItem): string {
  const boardIcon = item.sourceBoard
    ? '<span class="todo-card-badge" role="img" aria-label="' + escape(item.sourceBoard.name) + '" title="' + escape(item.sourceBoard.name) + '">' + escape(item.sourceBoard.icon) + ' ' + escape(item.sourceBoard.name) + '</span>'
    : '';
  const scheduleAction = item.status === 'todo'
    ? '<button type="button" class="todo-card-action" data-tb-schedule="' + escape(item.id) + '">开始排期</button>'
    : '';
  const completionAction = item.status === 'done'
    ? '<button type="button" class="todo-card-action" data-tb-edit-completed="' + escape(item.id) + '">修改完成日期</button>'
    : '<button type="button" class="todo-card-action" data-tb-complete="' + escape(item.id) + '">完成</button>';
  const actions = '<div class="todo-card-actions">' + scheduleAction + completionAction + '</div>';
  const title = item.url
    ? '<a href="' + escape(item.url) + '" target="_blank" rel="noopener" class="todo-card-link"><h3 class="todo-card-title">' + escape(item.title) + '</h3></a>'
    : '<h3 class="todo-card-title">' + escape(item.title) + '</h3>';
  const note = item.note ? '<p class="todo-card-note">' + escape(item.note) + '</p>' : '';
  const dateValue = item.status === 'done' ? (item.completedAt || item.date) : item.date;
  const dateIcon = item.status === 'done' ? '✅' : '📅';
  const due = dateValue ? '<span class="todo-card-meta-item"><span class="todo-card-meta-icon">' + dateIcon + '</span> ' + escape(relativeTime(dateValue)) + '</span>' : '';
  const created = item.createdAt ? '<span class="todo-card-meta-item"><span class="todo-card-meta-icon">🕒</span> ' + escape(relativeTime(item.createdAt)) + '</span>' : '';
  const meta = due || created ? '<div class="todo-card-meta">' + due + created + '</div>' : '';
  const className = 'todo-card' + (item.status === 'doing' ? ' todo-card-doing' : '') + (item.status === 'done' ? ' todo-card-done' : '');
  return '<article class="' + className + '"><div class="todo-card-topline">' + boardIcon + actions + '</div>' + title + meta + note + '</article>';
}

function renderViewSwitch(): string {
  return '<div class="todo-board-view-switch" role="tablist" aria-label="任务视图">' +
    '<button type="button" class="todo-board-view-button' + (currentView === 'board' ? ' active' : '') + '" data-tb-view="board" aria-selected="' + (currentView === 'board' ? 'true' : 'false') + '">看板视图</button>' +
    '<button type="button" class="todo-board-view-button' + (currentView === 'gantt' ? ' active' : '') + '" data-tb-view="gantt" aria-selected="' + (currentView === 'gantt' ? 'true' : 'false') + '">甘特图</button>' +
  '</div>';
}

function renderGantt(): string {
  const items = ganttItems();
  const toolbar = '<div class="todo-gantt-toolbar">' +
    '<div><h2 class="todo-gantt-title">任务甘特图</h2><p class="todo-gantt-subtitle">只显示已经排期的进行中任务，拖拽时间条即可调整计划。</p></div>' +
    '<div class="todo-gantt-controls"><button type="button" class="todo-gantt-today" data-tb-gantt-today>定位今天</button><label><input type="checkbox" data-tb-gantt-completed' + (ganttShowCompleted ? ' checked' : '') + '> 显示已完成</label></div>' +
  '</div>';
  if (items.length === 0) {
    return '<section class="todo-gantt" aria-label="任务甘特图">' + toolbar + '<div class="todo-gantt-empty"><strong>还没有排期中的任务</strong><span>在看板视图中点击待办任务的“开始排期”，填写开始和结束日期后加入甘特图。</span></div></section>';
  }

  const range = ganttRange(items);
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
    const period = shortDate(item.plannedStart) + '—' + shortDate(item.plannedEnd);
    return '<div class="todo-gantt-row" data-task-id="' + escape(item.id) + '">' +
      '<div class="todo-gantt-label"><div class="todo-gantt-label-content"><span class="todo-gantt-board-icon" role="img" aria-label="' + escape(item.sourceBoard?.name || '') + '">' + escape(item.sourceBoard?.icon || '') + '</span><span class="todo-gantt-task-title">' + escape(item.title) + '</span></div><button type="button" class="todo-gantt-remove" data-tb-gantt-remove="' + escape(item.id) + '" aria-label="移出甘特图：' + escape(item.title) + '">移出甘特图</button></div>' +
      '<div class="todo-gantt-track" data-task-track="' + escape(item.id) + '">' +
        '<button type="button" class="todo-gantt-bar todo-gantt-bar-' + status + '" data-tb-gantt-bar data-task-id="' + escape(item.id) + '" data-start="' + escape(item.plannedStart || '') + '" data-end="' + escape(item.plannedEnd || '') + '" style="--todo-gantt-start: ' + startColumn + '; --todo-gantt-span: ' + span + ';" aria-label="' + escape(item.title + '，计划' + period) + '">' +
          '<span class="todo-gantt-handle" data-gantt-edge="start" aria-hidden="true"></span><span class="todo-gantt-bar-copy"><strong>' + escape(item.title) + '</strong><small data-gantt-period>' + escape(period) + '</small></span><span class="todo-gantt-handle" data-gantt-edge="end" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<section class="todo-gantt" aria-label="任务甘特图">' + toolbar +
    '<div class="todo-gantt-window">' + shortDate(fmtDate(range.start)) + '—' + shortDate(fmtDate(range.end)) + '</div>' +
    '<div class="todo-gantt-scroll"><div class="todo-gantt-grid" data-range-start="' + escape(fmtDate(range.start)) + '" data-gantt-days="' + range.days.length + '" style="' + gridStyle + '">' +
      '<div class="todo-gantt-axis-row"><span class="todo-gantt-axis-label">任务 / 计划</span><div class="todo-gantt-axis-track">' + axis + '</div></div>' + rows +
    '</div></div>' +
    '<div class="todo-gantt-legend"><span><i class="todo-gantt-legend-swatch"></i>进行中</span><span><i class="todo-gantt-legend-swatch is-done"></i>已完成</span><span>拖动整条移动计划，拖动两端调整日期</span></div>' +
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
        '<p class="todo-modal-help">填写计划开始和结束日期。保存后，这个任务才会变为“进行中”。</p>' +
        '<div class="todo-date-fields"><label>计划开始日期<input type="date" name="plannedStart" value="' + escape(item.plannedStart || '') + '" required></label><label>计划结束日期<input type="date" name="plannedEnd" value="' + escape(item.plannedEnd || '') + '" required></label></div>' +
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

function renderStats(): string {
  const stats = boardStats();
  return '<div class="todo-board-stats"><span class="todo-board-stats-text">总 ' + stats.total + ' · 已完成 ' + stats.done + '</span><div class="todo-board-stats-bar"><div class="todo-board-stats-fill" style="width: ' + stats.rate + '%"></div></div></div>';
}

function renderColumn(status: 'todo' | 'doing' | 'done', label: string, statusClass: string, items: TodoItem[], suffix: string): string {
  const emptyText = status === 'todo' ? '📥 暂无待办' : status === 'doing' ? '🚀 暂无进行中' : '✅ 等待你完成第一个任务';
  const pageKey = activeTabId + ':' + status;
  const pageCount = Math.max(1, Math.ceil(items.length / BOARD_PAGE_SIZE));
  const page = Math.min(boardPages[pageKey] || 0, pageCount - 1);
  boardPages[pageKey] = page;
  const pageItems = items.slice(page * BOARD_PAGE_SIZE, (page + 1) * BOARD_PAGE_SIZE);
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
  const header = '<header class="todo-board-header"><div class="todo-board-date"><span class="todo-board-date-icon">📅</span><span class="todo-board-date-text">' + escape(todayStr()) + '（今天）</span></div><div class="todo-board-header-actions">' + renderViewSwitch() + '<button class="todo-board-history-toggle" type="button" data-tb-history>📜 查看历史 ' + (historyOpen ? '▴' : '▾') + '</button></div></header>';
  if (!boardsLoaded) return header + '<div class="todo-board-empty">看板数据未加载。请检查 todo-data.ts 是否正常编译。</div>';
  return header + renderStats() + (historyOpen ? renderHeatmap() : '') + (currentView === 'gantt' ? renderGantt() : renderColumns()) + renderScheduleModal() + renderCompletionModal();
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
  ganttDragState.bar.dataset.start = startValue;
  ganttDragState.bar.dataset.end = endValue;
  const period = ganttDragState.bar.querySelector<HTMLElement>('[data-gantt-period]');
  if (period) period.textContent = shortDate(startValue) + '—' + shortDate(endValue);
}

document.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement;
  const bar = target.closest<HTMLButtonElement>('[data-tb-gantt-bar]');
  if (!bar) return;
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
  if (!ganttDragState) return;
  event.preventDefault();
  updateGanttDragPreview(event.clientX);
});

function finishGanttDrag(): void {
  if (!ganttDragState) return;
  const { bar, itemId } = ganttDragState;
  const start = bar.dataset.start;
  const end = bar.dataset.end;
  bar.classList.remove('is-dragging');
  ganttDragState = null;
  if (start && end) updateItemState(itemId, { status: 'doing', plannedStart: start, plannedEnd: end });
  refresh();
}

function removeFromGantt(itemId: string): void {
  const patch = { ...(localState.items[itemId] || {}) };
  // date 和 createdAt 属于静态任务资料，不在本地状态补丁中，移出时保持原值。
  delete patch.plannedStart;
  delete patch.plannedEnd;
  delete patch.completedAt;
  patch.status = 'todo';
  localState.items[itemId] = patch;
  saveLocalState();
}

document.addEventListener('pointerup', finishGanttDrag);
document.addEventListener('pointercancel', finishGanttDrag);

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

  if (target.closest('[data-tb-modal-close]')) {
    scheduleItemId = null;
    completionItemId = null;
    refresh();
    return;
  }

  const ganttTodayButton = target.closest<HTMLButtonElement>('[data-tb-gantt-today]');
  if (ganttTodayButton) {
    document.querySelector('.todo-gantt-day.is-today')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
    historyOpen = !historyOpen;
    refresh();
    return;
  }

  const cell = target.closest<HTMLElement>('[data-hm-date]');
  if (cell) {
    const date = cell.dataset.hmDate || null;
    selectedHeatmapDate = selectedHeatmapDate === date ? null : date;
    refresh();
    return;
  }

  if (target.closest('[data-hm-close]')) {
    selectedHeatmapDate = null;
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
  const scheduleForm = form.closest<HTMLFormElement>('[data-tb-schedule-form]');
  if (scheduleForm) {
    event.preventDefault();
    const startInput = scheduleForm.elements.namedItem('plannedStart') as HTMLInputElement | null;
    const endInput = scheduleForm.elements.namedItem('plannedEnd') as HTMLInputElement | null;
    const itemId = scheduleForm.dataset.taskId;
    if (!startInput || !endInput || !itemId || !startInput.value || !endInput.value) return;
    if (endInput.value < startInput.value) {
      endInput.setCustomValidity('结束日期不能早于开始日期');
      endInput.reportValidity();
      endInput.setCustomValidity('');
      return;
    }
    updateItemState(itemId, { status: 'doing', plannedStart: startInput.value, plannedEnd: endInput.value });
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
  }
});

document.addEventListener('keydown', (event) => {
  const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-hm-date]');
  if (!cell || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  const date = cell.dataset.hmDate || null;
  selectedHeatmapDate = selectedHeatmapDate === date ? null : date;
  refresh();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (selectedHeatmapDate || scheduleItemId || completionItemId) {
    selectedHeatmapDate = null;
    scheduleItemId = null;
    completionItemId = null;
    refresh();
  }
});

refresh();
