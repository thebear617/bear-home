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

const SUMMARY_BOARD_IDS = ['life', 'coding', 'research'];
const BOARD_PAGE_SIZE = 3;

let activeTabId = 'summary';
let historyOpen = false;
let selectedHeatmapDate: string | null = null;
const boardPages: Record<string, number> = {};

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

function activeBoard(): TodoBoard | undefined {
  return boards().find((board) => board.id === activeTabId);
}

function allItems(): BoardItem[] {
  if (activeTabId === 'summary') {
    const merged: BoardItem[] = [];
    boards()
      .filter((board) => SUMMARY_BOARD_IDS.includes(board.id))
      .forEach((board) => {
        board.items.forEach((item) => {
          merged.push({
            ...item,
            sourceBoard: { id: board.id, name: board.name, icon: board.icon },
          });
        });
      });
    return merged;
  }
  return activeBoard()?.items || [];
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
  if (activeTabId === 'summary') {
    const merged: BoardItem[] = [];
    archivedBoards()
      .filter((board) => SUMMARY_BOARD_IDS.includes(board.id))
      .forEach((board) => {
        board.items.forEach((item) => {
          if ((item.date || today) === today) {
            merged.push({
              ...item,
              sourceBoard: { id: board.id, name: board.name, icon: board.icon },
            });
          }
        });
      });
    return merged;
  }
  const board = archivedBoards().find((item) => item.id === activeTabId);
  return board ? board.items.filter((item) => (item.date || today) === today) : [];
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
  archivedBoards().forEach((board) => {
    board.items.forEach((item) => {
      if (!item.date) return;
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)?.push({
        title: item.title,
        url: item.url,
        boardName: board.name,
        boardIcon: board.icon,
      });
    });
  });
  return map;
}

function fmtDate(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + pad(date.getDate());
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
  const badge = activeTabId === 'summary' && item.sourceBoard
    ? '<span class="todo-card-badge">' + escape(item.sourceBoard.icon) + ' ' + escape(item.sourceBoard.name) + '</span>'
    : '';
  const title = item.url
    ? '<a href="' + escape(item.url) + '" target="_blank" rel="noopener" class="todo-card-link"><h3 class="todo-card-title">' + escape(item.title) + '</h3></a>'
    : '<h3 class="todo-card-title">' + escape(item.title) + '</h3>';
  const note = item.note ? '<p class="todo-card-note">' + escape(item.note) + '</p>' : '';
  const due = item.date ? '<div class="todo-card-meta"><span class="todo-card-meta-icon">📅</span> ' + escape(relativeTime(item.date)) + '</div>' : '';
  const created = item.createdAt ? '<div class="todo-card-meta"><span class="todo-card-meta-icon">🕒</span> ' + escape(relativeTime(item.createdAt)) + '</div>' : '';
  const className = 'todo-card' + (item.status === 'doing' ? ' todo-card-doing' : '') + (item.status === 'done' ? ' todo-card-done' : '');
  return '<article class="' + className + '">' + badge + title + note + due + created + '</article>';
}

function renderTabs(): string {
  return '<nav class="todo-board-tabs" aria-label="任务分类">' + boards().map((board) =>
    '<button type="button" class="todo-board-tab' + (board.id === activeTabId ? ' active' : '') + '" data-tb-tab="' + escape(board.id) + '">' +
      '<span class="todo-board-tab-icon">' + escape(board.icon) + '</span><span class="todo-board-tab-name">' + escape(board.name) + '</span>' +
    '</button>'
  ).join('') + '</nav>';
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
  return '<header class="todo-board-header"><div class="todo-board-date"><span class="todo-board-date-icon">📅</span><span class="todo-board-date-text">' + escape(todayStr()) + '（今天）</span></div><button class="todo-board-history-toggle" type="button" data-tb-history>📜 查看历史 ' + (historyOpen ? '▴' : '▾') + '</button></header>' +
    (boardsLoaded ? renderStats() + renderTabs() + (historyOpen ? renderHeatmap() : '') + renderColumns() : '<div class="todo-board-empty">看板数据未加载。请检查 todo-data.ts 是否正常编译。</div>');
}

function refresh() {
  const container = document.getElementById('todoBoard');
  if (container) container.innerHTML = renderBoard();
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const tabButton = target.closest<HTMLButtonElement>('[data-tb-tab]');
  if (tabButton) {
    selectedHeatmapDate = null;
    activeTabId = tabButton.dataset.tbTab || 'summary';
    Object.keys(boardPages).forEach((key) => delete boardPages[key]);
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

document.addEventListener('keydown', (event) => {
  const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-hm-date]');
  if (!cell || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  const date = cell.dataset.hmDate || null;
  selectedHeatmapDate = selectedHeatmapDate === date ? null : date;
  refresh();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selectedHeatmapDate) {
    selectedHeatmapDate = null;
    refresh();
  }
});

refresh();
