const { createApp } = Vue;

marked.use({
  renderer: {
    link({ href, raw, tokens }) {
      if (!raw.startsWith('[')) return this.parser.parseInline(tokens);
      const text = this.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank">${text}</a>`;
    }
  }
});

const dailyRecords = Object.assign({}, diaryRecords, manualRecords);

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }

/* ─── Lunar calendar ─── */

const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const LUNAR_DAY_MAP = {
  1: '初一', 2: '初二', 3: '初三', 4: '初四', 5: '初五', 6: '初六', 7: '初七', 8: '初八', 9: '初九', 10: '初十',
  11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五', 16: '十六', 17: '十七', 18: '十八', 19: '十九',
  20: '二十', 21: '廿一', 22: '廿二', 23: '廿三', 24: '廿四', 25: '廿五', 26: '廿六', 27: '廿七', 28: '廿八',
  29: '廿九', 30: '三十'
};
const LUNAR_STARTS = [
  [1, 19, 12], [2, 17, 1], [3, 19, 2], [4, 17, 3],
  [5, 17, 4], [6, 15, 5], [7, 15, 6], [8, 13, 7],
  [9, 12, 8], [10, 11, 9], [11, 10, 10], [12, 9, 11]
];

function getLunarDayName(n) { return LUNAR_DAY_MAP[n] || String(n); }

function getLunarInfo(year, month, day) {
  const target = new Date(year, month - 1, day);
  if (month === 1 && day < 19) {
    const prevNov1 = new Date(2025, 11, 21);
    const diff = Math.floor((target - prevNov1) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 30) return { lMonth: 11, lDay: diff + 1, lMonthName: '十一月', isStart: diff === 0 };
    if (diff >= 30) return { lMonth: 12, lDay: diff - 29, lMonthName: '十二月', isStart: diff === 30 };
    return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  }
  let best = null;
  for (const [m, d, lm] of LUNAR_STARTS) {
    const s = new Date(year, m - 1, d);
    if (s <= target) best = { start: s, lMonth: lm };
  }
  if (!best) return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  const diff = Math.floor((target - best.start) / (1000 * 60 * 60 * 24));
  return { lMonth: best.lMonth, lDay: diff + 1, lMonthName: LUNAR_MONTH_NAMES[best.lMonth], isStart: diff + 1 === 1 };
}

/* ─── Calendar View ─── */

const CalendarView = {
  template: `
    <div class="calendar-view">
      <div class="cal-header">
        <span class="cal-title">{{ calendarYear }}年{{ calendarMonth }}月</span>
        <div class="cal-nav">
          <button class="cal-nav-btn" @click="prevMonth">◀</button>
          <button class="cal-today-btn" @click="goToday">今天</button>
          <button class="cal-nav-btn" @click="nextMonth">▶</button>
        </div>
      </div>
      <div class="cal-weekdays">
        <span v-for="w in weekdays" :key="w" class="cal-weekday">{{ w }}</span>
      </div>
      <div class="cal-grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key || 'x' + cell.date"
          class="cal-cell"
          :class="{
            'cal-other-month': !cell.isCurrentMonth,
            'cal-today': cell.isToday,
            'cal-has-data': !!cell.record || !!cell.hasExpense,
            'cal-selected': cell.key === selectedDay
          }"
          @click="selectDay(cell)"
        >
          <span class="cal-lunar" :class="{ 'cal-lunar-start': cell.isLunarStart }">
            {{ cell.isLunarStart ? cell.lunarMonth : cell.lunarDay }}
          </span>
          <span class="cal-date" :class="{ 'cal-date-today': cell.isToday }">
            {{ cell.date }}日
          </span>
          <span v-if="cell.record" class="cal-value">{{ cell.record.value }}</span>
          <span v-if="cell.hasExpense" class="cal-expense-dot"></span>
        </div>
      </div>

      <div v-if="selectedDay && (records[selectedDay] || dayExpenses(selectedDay).length)" class="detail-panel">
        <div class="detail-header">
          <span class="detail-title">{{ formatDetailTitle(selectedDay) }}</span>
          <button class="detail-close" @click="selectedDay = null">✕</button>
        </div>
        <div class="detail-body">
          <div v-if="records[selectedDay]" class="detail-row">
            <span class="detail-label">{{ label }}</span>
            <span class="detail-val">{{ records[selectedDay].value }} / {{ taskList(selectedDay) ? taskList(selectedDay).length : 0 }}</span>
          </div>
          <div v-if="records[selectedDay] && taskList(selectedDay).length" class="detail-tasks">
            <div v-for="(task, i) in taskList(selectedDay)" :key="i" class="task-item">
              <span class="task-num">{{ i + 1 }}</span>
              <span class="task-time">{{ task.time }}</span>
              <span class="task-text">{{ task.desc }}</span>
            </div>
          </div>
          <div v-if="dayExpenses(selectedDay).length" class="detail-expenses">
            <div class="detail-row">
              <span class="detail-label">当日支出</span>
              <span class="detail-val expense-amount">¥{{ dayExpenseTotal(selectedDay).toFixed(2) }}</span>
            </div>
            <div v-for="(exp, i) in dayExpenses(selectedDay)" :key="i" class="expense-detail-item">
              <span class="expense-detail-sub">{{ exp.sub }}</span>
              <span class="expense-detail-note" v-if="exp.note">{{ exp.note }}</span>
              <span class="expense-detail-amount">¥{{ exp.amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="monthRecords.length > 0 || monthExpenseTotal > 0" class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">{{ calendarMonth }}月记录</span>
          <span class="summary-value">{{ monthRecords.length }} 天</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">{{ label }}合计</span>
          <span class="summary-value">{{ totalValue }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">日均</span>
          <span class="summary-value">{{ avgValue }}</span>
        </div>
        <div v-if="monthExpenseTotal > 0" class="summary-divider"></div>
        <div v-if="monthExpenseTotal > 0" class="summary-item">
          <span class="summary-label">本月支出</span>
          <span class="summary-value expense-amount">¥{{ monthExpenseTotal.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1,
      selectedDay: null,
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      records: dailyRecords,
      label: recordLabel
    };
  },
  computed: {
    calendarCells() {
      const cells = [];
      const firstDay = new Date(this.calendarYear, this.calendarMonth - 1, 1);
      const lastDay = new Date(this.calendarYear, this.calendarMonth, 0);
      const daysInMonth = lastDay.getDate();
      const startDow = firstDay.getDay();
      const prevMonthLastDay = new Date(this.calendarYear, this.calendarMonth - 1, 0).getDate();
      const today = new Date();

      for (let i = 0; i < startDow; i++) {
        const d = prevMonthLastDay - startDow + i + 1;
        const lunar = getLunarInfo(this.calendarYear, this.calendarMonth - 1, d);
        cells.push({
          date: d, isToday: false, isCurrentMonth: false,
          lunarDay: getLunarDayName(lunar.lDay),
          lunarMonth: lunar.isStart ? lunar.lMonthName : null,
          isLunarStart: lunar.isStart, key: '', record: null
        });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const isToday = this.calendarYear === today.getFullYear() &&
                        this.calendarMonth === today.getMonth() + 1 &&
                        d === today.getDate();
        const lunar = getLunarInfo(this.calendarYear, this.calendarMonth, d);
        const key = dateKey(this.calendarYear, this.calendarMonth, d);
        const record = dailyRecords[key] || null;
        const hasExpense = expenseRecords.some(r => r.date === key);
        cells.push({
          date: d, isToday, isCurrentMonth: true,
          lunarDay: getLunarDayName(lunar.lDay),
          lunarMonth: lunar.isStart ? lunar.lMonthName : null,
          isLunarStart: lunar.isStart, key, record, hasExpense
        });
      }

      const totalCells = startDow + daysInMonth;
      const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let d = 1; d <= remaining; d++) {
        const lunar = getLunarInfo(this.calendarYear, this.calendarMonth + 1, d);
        cells.push({
          date: d, isToday: false, isCurrentMonth: false,
          lunarDay: getLunarDayName(lunar.lDay),
          lunarMonth: lunar.isStart ? lunar.lMonthName : null,
          isLunarStart: lunar.isStart, key: '', record: null
        });
      }

      return cells;
    },
    monthRecords() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      return Object.entries(dailyRecords)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, record]) => ({ key, ...record }))
        .sort((a, b) => a.key.localeCompare(b.key));
    },
    totalValue() {
      return this.monthRecords.reduce((sum, r) => sum + r.value, 0);
    },
    avgValue() {
      return this.monthRecords.length > 0
        ? (this.totalValue / this.monthRecords.length).toFixed(1)
        : '—';
    },
    monthExpenseTotal() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      return expenseRecords
        .filter(r => r.date.startsWith(prefix))
        .reduce((s, r) => s + r.amount, 0);
    }
  },
  methods: {
    prevMonth() {
      if (this.calendarMonth === 1) { this.calendarYear--; this.calendarMonth = 12; }
      else this.calendarMonth--;
      this.selectedDay = null;
    },
    nextMonth() {
      if (this.calendarMonth === 12) { this.calendarYear++; this.calendarMonth = 1; }
      else this.calendarMonth++;
      this.selectedDay = null;
    },
    goToday() {
      const now = new Date();
      this.calendarYear = now.getFullYear();
      this.calendarMonth = now.getMonth() + 1;
      this.selectedDay = null;
    },
    selectDay(cell) {
      const hasRecord = !!cell.record;
      const hasExpense = cell.key && expenseRecords.some(r => r.date === cell.key);
      if (!hasRecord && !hasExpense) return;
      this.selectedDay = this.selectedDay === cell.key ? null : cell.key;
    },
    formatDetailTitle(key) {
      const d = new Date(key + 'T00:00:00');
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    },
    taskList(key) {
      const record = dailyRecords[key];
      if (!record || !record.tasks) return [];
      return record.tasks;
    },
    dayExpenses(key) {
      return expenseRecords.filter(r => r.date === key);
    },
    dayExpenseTotal(key) {
      return this.dayExpenses(key).reduce((s, r) => s + r.amount, 0);
    }
  }
};

/* ─── Route Table ─── */

const RouteTable = {
  template: `
    <div class="route-table">
      <div class="route-search">
        <input
          v-model="query"
          type="text"
          placeholder="搜索路由..."
        />
      </div>
      <div v-if="filteredCategories.length === 0" class="empty-state">没有匹配的路由</div>
      <div
        v-for="cat in filteredCategories"
        :key="cat.title"
        class="check-section"
        :class="{ open: cat.open }"
      >
        <div class="section-header" @click="cat.open = !cat.open">
          <div class="section-header-left">
            <h2>{{ cat.title }}</h2>
          </div>
          <div class="section-header-right">
            <span class="section-count">{{ cat.filteredItems.length }}</span>
            <span class="section-arrow">▸</span>
          </div>
        </div>
        <div class="section-body" v-show="cat.open">
          <div v-for="item in cat.filteredItems" :key="item.name" class="route-item">
            <div class="route-item-name">{{ item.name }}</div>
            <div v-if="item.desc" class="route-item-desc">{{ item.desc }}</div>
            <a v-if="item.url" :href="item.url" target="_blank" class="route-item-link">{{ item.url }}</a>
            <code v-else-if="item.path" class="route-item-path">{{ item.path }}</code>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      query: '',
      categories: routeCategories.map(cat => ({ ...cat, open: true, filteredItems: cat.items }))
    };
  },
  computed: {
    filteredCategories() {
      const q = this.query.trim().toLowerCase();
      if (!q) {
        return this.categories;
      }
      return this.categories
        .map(cat => ({
          ...cat,
          filteredItems: cat.items.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.desc && item.desc.toLowerCase().includes(q))
          )
        }))
        .filter(cat => cat.filteredItems.length > 0);
    }
  }
};

/* ─── Expense View ─── */

const ExpenseView = {
  template: `
    <div class="expense-view">
      <div class="cal-header">
        <span class="cal-title">{{ calendarYear }}年{{ calendarMonth }}月 · 支出</span>
        <div class="cal-nav">
          <button class="cal-nav-btn" @click="prevMonth">◀</button>
          <button class="cal-today-btn" @click="goToday">本月</button>
          <button class="cal-nav-btn" @click="nextMonth">▶</button>
        </div>
      </div>

      <div v-if="monthTotal > 0" class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">本月支出</span>
          <span class="summary-value expense-amount">¥{{ monthTotal.toFixed(2) }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">记录笔数</span>
          <span class="summary-value">{{ monthExpenses.length }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">日均</span>
          <span class="summary-value">¥{{ monthAvg }}</span>
        </div>
      </div>

      <div v-if="monthTotal === 0" class="empty-state">本月暂无支出记录</div>

      <div v-for="group in categoryGroups" :key="group.name" class="check-section" :class="{ open: isOpen(group.name) }">
        <div class="section-header" @click="toggleGroup(group.name)">
          <div class="section-header-left">
            <span class="expense-cat-icon">{{ group.icon }}</span>
            <h2>{{ group.name }}</h2>
          </div>
          <div class="section-header-right">
            <span class="expense-cat-amount">¥{{ group.total.toFixed(2) }}</span>
            <span class="section-count">{{ group.items.length }}</span>
            <span class="section-arrow">▸</span>
          </div>
        </div>
        <div class="section-body" v-show="isOpen(group.name)">
          <div v-for="item in group.items" :key="item.date + item.sub + item.amount" class="expense-item">
            <div class="expense-item-left">
              <span class="expense-item-sub">{{ item.sub }}</span>
              <span class="expense-item-note" v-if="item.note">{{ item.note }}</span>
            </div>
            <div class="expense-item-right">
              <span class="expense-item-amount">¥{{ item.amount.toFixed(2) }}</span>
              <span class="expense-item-date">{{ formatShortDate(item.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const now = new Date();
    return {
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1,
      categories: expenseCategories,
      openGroups: {}
    };
  },
  computed: {
    monthExpenses() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      return expenseRecords
        .filter(r => r.date.startsWith(prefix))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    monthTotal() {
      return this.monthExpenses.reduce((s, r) => s + r.amount, 0);
    },
    monthAvg() {
      if (this.monthExpenses.length === 0) return '—';
      const days = new Set(this.monthExpenses.map(r => r.date)).size;
      return (this.monthTotal / days).toFixed(2);
    },
    categoryGroups() {
      return this.categories
        .map(cat => {
          const items = this.monthExpenses.filter(r => r.cat === cat.name);
          const total = items.reduce((s, r) => s + r.amount, 0);
          return { ...cat, items, total, open: items.length > 0 };
        })
        .filter(g => g.items.length > 0)
        .sort((a, b) => b.total - a.total);
    }
  },
  methods: {
    prevMonth() {
      if (this.calendarMonth === 1) { this.calendarYear--; this.calendarMonth = 12; }
      else this.calendarMonth--;
    },
    nextMonth() {
      if (this.calendarMonth === 12) { this.calendarYear++; this.calendarMonth = 1; }
      else this.calendarMonth++;
    },
    goToday() {
      const now = new Date();
      this.calendarYear = now.getFullYear();
      this.calendarMonth = now.getMonth() + 1;
    },
    formatShortDate(key) {
      const d = new Date(key + 'T00:00:00');
      return `${d.getMonth() + 1}/${d.getDate()}`;
    },
    isOpen(name) {
      return this.openGroups[name] !== false;
    },
    toggleGroup(name) {
      this.openGroups[name] = !this.isOpen(name);
    }
  }
};

/* ─── App ─── */

const app = createApp({
  data() {
    return {
      tabs: [
        { id: 'calendar', title: '每日日历追踪', icon: '📅' },
        { id: 'expense', title: '支出记录', icon: '💰' },
        { id: 'cookbook', title: 'Cookbook', icon: '📖' },
        { id: 'routes', title: '路由表', icon: '🗺️' }
      ],
      activeTab: 'calendar',
      sidebarOpen: false,
      cookbookQuery: '',
      cookbookEntries: cookbookEntries
    };
  },
  computed: {
    cookbookFiltered() {
      const q = this.cookbookQuery.trim().toLowerCase();
      if (!q) return this.cookbookEntries;
      return this.cookbookEntries.filter(entry =>
        entry.title.toLowerCase().includes(q) ||
        entry.tags.some(tag => tag.toLowerCase().includes(q)) ||
        entry.body.toLowerCase().includes(q)
      );
    }
  },
  methods: {
    renderMarkdown(md) {
      return marked.parse(md, { breaks: true, gfm: true });
    },
    switchTab(id) {
      this.activeTab = id;
      if (window.innerWidth < 720) this.sidebarOpen = false;
    }
  },
  watch: {
    sidebarOpen(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  },
  mounted() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.sidebarOpen = false;
    });
  }
});

app.component('calendar-view', CalendarView);
app.component('route-table', RouteTable);
app.component('expense-view', ExpenseView);
app.mount('#app');
