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

function parseHM(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
function minToHM(min) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${pad(h)}:${pad(m)}`;
}

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

/* ─── Obsidian Preprocessor ─── */

function stripWikilinks(md) {
  md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  md = md.replace(/\[\[([^\]]+)\]\]/g, function(m, path) {
    var parts = path.split('/');
    return parts[parts.length - 1].replace(/\.md$/, '');
  });
  return md;
}

function buildCallout(type, expand, title, contentHtml) {
  if (expand === '-') {
    return '<details class="callout callout-' + type + '"><summary>' + title + '</summary><div class="callout-body">' + contentHtml + '</div></details>';
  }
  return '<div class="callout callout-' + type + '"><div class="callout-title">' + title + '</div><div class="callout-body">' + contentHtml + '</div></div>';
}

function preprocessObsidian(md, markedFn) {
  md = md.replace(/^---\n[\s\S]*?\n---\n?/, '');
  md = stripWikilinks(md);

  var lines = md.split('\n');
  var placeholders = [];
  var result = [];
  var inCallout = false;
  var calloutType = '';
  var calloutExpand = '';
  var calloutTitle = '';
  var calloutLines = [];

  function flushCallout() {
    var raw = calloutLines.join('\n').trim();
    var contentHtml = markedFn(raw);
    var html = buildCallout(calloutType, calloutExpand, calloutTitle, contentHtml);
    var ph = '<div data-callout="' + placeholders.length + '"></div>';
    placeholders.push(html);
    result.push(ph);
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var cm = line.match(/^> \[!(\w+)\]([+-])?\s*(.*)/);
    if (cm) {
      if (inCallout) flushCallout();
      inCallout = true;
      calloutType = cm[1];
      calloutExpand = cm[2] || '';
      calloutTitle = cm[3].replace(/（来源：.*?）\s*$/, '').replace(/\(来源：.*?\)\s*$/, '').trim();
      calloutLines = [];
    } else if (inCallout && line.startsWith('>')) {
      var content = line.slice(1);
      if (content.startsWith(' ')) content = content.slice(1);
      calloutLines.push(content);
    } else {
      if (inCallout) {
        flushCallout();
        inCallout = false;
      }
      result.push(line);
    }
  }
  if (inCallout) flushCallout();

  var processed = result.join('\n');
  var html = markedFn(processed);

  for (var p = 0; p < placeholders.length; p++) {
    html = html.replace('<div data-callout="' + p + '"></div>', placeholders[p]);
  }

  return html;
}

/* ─── Valorant View ─── */

const ValorantView = {
  template: `
    <div class="valorant-view">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else>
        <div class="vmap-grid">
          <button
            v-for="(s, i) in sections"
            :key="s.id"
            class="vmap-card"
            :class="{ active: activeSection === s.id }"
            :style="cardStyle(i)"
            @click="selectSection(s.id)"
          >{{ s.title }}</button>
        </div>
        <div v-for="section in sections" :key="section.id" v-show="activeSection === section.id" class="vmap-content">
          <h2 class="vmap-title">{{ section.title }}</h2>
          <div v-if="section.subSections && section.subSections.length > 1" class="vmap-tabs">
            <button
              v-for="sub in section.subSections"
              :key="sub.id"
              class="vmap-tab"
              :class="{ active: activeSub[section.id] === sub.id }"
              @click="activeSub[section.id] = sub.id"
            >{{ sub.title }}</button>
          </div>
          <div v-if="activeSubForSection(section)" class="valorant-body" v-html="activeSubForSection(section).html"></div>
          <div v-else class="valorant-body" v-html="section.html"></div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      sections: [],
      activeSection: '',
      activeSub: {},
      gradients: [
        'linear-gradient(135deg, #FFD3B6, #FFAAA5)',
        'linear-gradient(135deg, #A8E6CF, #DCEDC1)',
        'linear-gradient(135deg, #E8D5FF, #B388FF)',
        'linear-gradient(135deg, #A2D2FF, #BDE0FE)',
        'linear-gradient(135deg, #FFC3A0, #FFAFBD)',
        'linear-gradient(135deg, #FFF176, #FFB300)',
        'linear-gradient(135deg, #FADADD, #F4A7B9)',
        'linear-gradient(135deg, #B5EAD7, #C7CEEA)',
        'linear-gradient(135deg, #FFE0B2, #FF8A65)'
      ]
    };
  },
  methods: {
    cardStyle(i) {
      return { background: this.gradients[i % this.gradients.length] };
    },
    splitByHeading(html) {
      var sections = [];
      var h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
      var prevSection = null;
      var match;
      while ((match = h1Regex.exec(html)) !== null) {
        var title = match[1].replace(/<[^>]+>/g, '').trim();
        if (prevSection) {
          prevSection.html = html.slice(prevSection.startIdx, match.index);
        }
        var id = 'sec-' + sections.length;
        prevSection = { id: id, title: title, html: '', searchText: title, startIdx: match.index };
        sections.push(prevSection);
      }
      if (prevSection) {
        prevSection.html = html.slice(prevSection.startIdx);
      }
      return sections;
    },
    splitSubSections(html) {
      var subs = [];
      var h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
      var matches = [];
      var match;
      while ((match = h2Regex.exec(html)) !== null) {
        matches.push({ title: match[1].replace(/<[^>]+>/g, '').trim(), index: match.index });
      }
      for (var i = 0; i < matches.length; i++) {
        var startIdx = matches[i].index;
        var endIdx = i + 1 < matches.length ? matches[i + 1].index : html.length;
        subs.push({ id: 'sub-' + i, title: matches[i].title, html: html.slice(startIdx, endIdx) });
      }
      return subs;
    },
    activeSubForSection(section) {
      var subId = this.activeSub[section.id];
      if (!subId || !section.subSections) return null;
      for (var i = 0; i < section.subSections.length; i++) {
        if (section.subSections[i].id === subId) return section.subSections[i];
      }
      return null;
    },
    selectSection(id) {
      this.activeSection = id;
      if (!this.activeSub[id]) {
        var section = this.sections.find(function(s) { return s.id === id; });
        if (section && section.subSections && section.subSections.length) {
          this.activeSub[id] = section.subSections[0].id;
        }
      }
    },
    loadContent() {
      try {
        var mapMd = typeof valorantMapMd !== 'undefined' ? valorantMapMd : '';

        if (!mapMd) throw new Error('数据文件未加载，请重建 valorant-data.js');

        var render = function(md) { return marked.parse(md); };
        var mapHtml = preprocessObsidian(mapMd, render);
        mapHtml = mapHtml.replace(/<h1[^>]*>.*?<\/h1>/, '');
        mapHtml = mapHtml.replace(/<h2/g, '<h1').replace(/<\/h2>/g, '</h1>');
        mapHtml = mapHtml.replace(/<h3/g, '<h2').replace(/<\/h3>/g, '</h2>');

        var rawSections = this.splitByHeading(mapHtml);
        if (rawSections.length >= 2) {
          var mergedHtml = rawSections[0].html + rawSections[1].html;
          var merged = { id: 'overview', title: '元认知与全地图', html: mergedHtml, searchText: '元认知 全地图' };
          var rest = rawSections.slice(2);
          this.sections = [merged].concat(rest);
        } else {
          this.sections = rawSections;
        }
        for (var i = 0; i < this.sections.length; i++) {
          var sec = this.sections[i];
          var subs = this.splitSubSections(sec.html);
          sec.subSections = subs;
          if (subs.length > 0) {
            this.activeSub[sec.id] = subs[0].id;
          }
        }
        if (this.sections.length) this.activeSection = this.sections[0].id;
        this.loading = false;
      } catch (err) {
        this.sections = [{ id: 'error', title: '加载失败', html: '<p>' + err.message + '</p><p>请确认软链和网络正常</p>', searchText: '' }];
        this.loading = false;
      }
    }
  },
  mounted() {
    this.loadContent();
  }
};

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

      <div v-if="monthExpenseTotal > 0 || sleepStats.count > 0" class="summary-bar">
        <div v-if="monthExpenseTotal > 0" class="summary-item">
          <span class="summary-label">本月支出</span>
          <span class="summary-value expense-amount">¥{{ monthExpenseTotal.toFixed(2) }}</span>
        </div>
        <div v-if="monthExpenseTotal > 0" class="summary-divider"></div>
        <div v-if="monthExpenseTotal > 0" class="summary-item">
          <span class="summary-label">日均支出</span>
          <span class="summary-value expense-amount">¥{{ monthAvgExpense }}</span>
        </div>
        <div v-if="monthExpenseTotal > 0 && sleepStats.count > 0" class="summary-divider"></div>
        <div v-if="sleepStats.count > 0" class="summary-item">
          <span class="summary-label">平均入睡</span>
          <span class="summary-value">{{ sleepStats.avgBedtime }}</span>
        </div>
        <div v-if="sleepStats.count > 0" class="summary-divider"></div>
        <div v-if="sleepStats.count > 0" class="summary-item">
          <span class="summary-label">平均起床</span>
          <span class="summary-value">{{ sleepStats.avgWakeup }}</span>
        </div>
        <div v-if="sleepStats.count > 0" class="summary-divider"></div>
        <div v-if="sleepStats.count > 0" class="summary-item">
          <span class="summary-label">平均睡眠</span>
          <span class="summary-value">{{ sleepStats.avgDuration }}h</span>
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
    monthExpenseTotal() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      return expenseRecords
        .filter(r => r.date.startsWith(prefix))
        .reduce((s, r) => s + r.amount, 0);
    },
    monthAvgExpense() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      const days = new Set(
        expenseRecords
          .filter(r => r.date.startsWith(prefix))
          .map(r => r.date)
      );
      return days.size > 0 ? (this.monthExpenseTotal / days.size).toFixed(2) : '—';
    },
    sleepStats() {
      const prefix = `${this.calendarYear}-${pad(this.calendarMonth)}`;
      const bedtimes = [];
      const wakeups = [];
      const durations = [];
      Object.entries(dailyRecords).forEach(([key, record]) => {
        if (!key.startsWith(prefix)) return;
        const tasks = record.tasks || [];
        let best = null;
        let bestStart = -1;
        for (const task of tasks) {
          if (task.desc !== '睡觉' && task.desc !== '睡懒觉') continue;
          const parts = task.time.split('-');
          if (parts.length !== 2) continue;
          const s = parseHM(parts[0].trim());
          const e = parseHM(parts[1].trim());
          if (isNaN(s) || isNaN(e)) continue;
          if (s > bestStart) { bestStart = s; best = { s, e }; }
        }
        if (best) {
          let endMin = best.e;
          if (endMin <= best.s) endMin += 24 * 60;
          bedtimes.push(best.s);
          wakeups.push(best.e);
          durations.push(endMin - best.s);
        }
      });
      if (bedtimes.length === 0) return { count: 0, avgBedtime: '', avgWakeup: '', avgDuration: '' };
      const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
      return {
        count: bedtimes.length,
        avgBedtime: minToHM(avg(bedtimes)),
        avgWakeup: minToHM(avg(wakeups)),
        avgDuration: (avg(durations) / 60).toFixed(1)
      };
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
          <div class="route-grid">
            <template v-for="item in cat.filteredItems" :key="item.name">
              <a v-if="item.url" :href="item.url" target="_blank" class="route-card">
                <div class="route-card-name">{{ item.name }}</div>
                <div v-if="item.desc" class="route-card-desc">{{ item.desc }}</div>
              </a>
              <div v-else class="route-card">
                <div class="route-card-name">{{ item.name }}</div>
                <div v-if="item.desc" class="route-card-desc">{{ item.desc }}</div>
                <code v-if="item.path" class="route-card-path">{{ item.path }}</code>
              </div>
            </template>
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
      return routeCategories
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

/* ─── Membership View ─── */

const MembershipView = {
  template: `
    <div class="membership-view">
      <div class="membership-filter-grid">
        <button
          class="membership-filter-card"
          :class="{ active: group === 'active' }"
          @click="group = 'active'"
        >
          <div class="mfc-label">未过期</div>
          <div class="mfc-amount">月均 ¥{{ activeMonthlyTotal }}</div>
        </button>
        <button
          class="membership-filter-card"
          :class="{ active: group === 'expired' }"
          @click="group = 'expired'"
        >
          <div class="mfc-label">已过期</div>
        </button>
      </div>

      <div class="route-search">
        <input v-model="query" type="text" placeholder="搜索会员名或标签..." />
      </div>

      <div v-if="!groupedByTag.length" class="empty-state">无匹配记录</div>

      <div
        v-for="cat in groupedByTag"
        :key="cat.tag"
        class="check-section"
        :class="{ open: isTagOpen(cat.tag) }"
      >
        <div class="section-header" @click="toggleTag(cat.tag)">
          <div class="section-header-left">
            <h2>{{ cat.tag }}</h2>
          </div>
          <div class="section-header-right">
            <span class="section-count">{{ cat.records.length }}</span>
            <span class="section-arrow">▸</span>
          </div>
        </div>
        <div class="section-body" v-show="isTagOpen(cat.tag)">
          <div class="table-wrap">
            <table class="membership-table">
              <thead>
                <tr>
                  <th>会员名称</th>
                  <th>到期时间</th>
                  <th>剩余天数</th>
                  <th>价格</th>
                  <th>标签</th>
                  <th>备注</th>
                  <th>链接</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in cat.records"
                  :key="r.name"
                  :class="{ 'row-unknown': !r.expireDate }"
                >
                  <td class="mt-name">{{ r.name }}</td>
                  <td>{{ r.expireDate || '未知' }}</td>
                  <td :class="daysClass(r)">{{ formatDays(r) }}</td>
                  <td>{{ r.price != null ? '¥' + Math.round(r.price) : '—' }}</td>
                  <td>
                    <span v-for="t in r.tags" :key="t" class="membership-tag">{{ t }}</span>
                  </td>
                  <td class="mt-note" :title="r.note">{{ r.note }}</td>
                  <td>
                    <a v-if="r.url" :href="r.url" target="_blank" rel="noopener" class="mt-link">↗</a>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      group: 'active',
      query: '',
      openTags: {},
      todayMs: today.getTime()
    };
  },
  computed: {
    expiredRecords() {
      return membershipRecords
        .filter(r => r.expireDate && this.parseDate(r.expireDate) < this.todayMs)
        .sort((a, b) => this.parseDate(b.expireDate) - this.parseDate(a.expireDate));
    },
    activeRecords() {
      return membershipRecords
        .filter(r => {
          if (!r.expireDate) return false;
          return this.parseDate(r.expireDate) >= this.todayMs;
        })
        .sort((a, b) => {
          if (!a.expireDate && !b.expireDate) return a.name.localeCompare(b.name, 'zh-CN');
          if (!a.expireDate) return 1;
          if (!b.expireDate) return -1;
          return this.parseDate(a.expireDate) - this.parseDate(b.expireDate);
        });
    },
    currentGroupRecords() {
      const base = this.group === 'active' ? this.activeRecords : this.expiredRecords;
      const q = this.query.trim().toLowerCase();
      if (!q) return base;
      return base.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    },
    groupedByTag() {
      const map = {};
      for (const r of this.currentGroupRecords) {
        const tag = (r.tags && r.tags[0]) || '其他';
        if (!map[tag]) map[tag] = [];
        map[tag].push(r);
      }
      return Object.entries(map)
        .map(([tag, records]) => ({ tag, records }))
        .sort((a, b) => b.records.length - a.records.length || a.tag.localeCompare(b.tag, 'zh-CN'));
    },
    activeMonthlyTotal() {
      const total = this.activeRecords.reduce((s, r) => {
        if (r.price == null || !r.cycleMonths) return s;
        return s + r.price / r.cycleMonths;
      }, 0);
      return Math.round(total);
    }
  },
  methods: {
    parseDate(s) {
      return new Date(s + 'T00:00:00').getTime();
    },
    daysClass(r) {
      if (!r.expireDate) return 'days-unknown';
      const diff = this.parseDate(r.expireDate) - this.todayMs;
      if (diff < 0) return 'days-expired';
      if (diff <= 30 * 86400000) return 'days-warning';
      return 'days-ok';
    },
    formatDays(r) {
      if (!r.expireDate) return '未知';
      const diff = Math.round((this.parseDate(r.expireDate) - this.todayMs) / 86400000);
      if (diff < 0) return `已过期 ${-diff} 天`;
      return `${diff} 天`;
    },
    isTagOpen(tag) {
      return this.openTags[tag] !== false;
    },
    toggleTag(tag) {
      this.openTags[tag] = !this.isTagOpen(tag);
    }
  }
};

/* ─── Cookbook Timeline ─── */

const CookbookTimeline = {
  props: ['entries', 'query'],
  emits: ['select'],
  template: `
    <div class="timeline-view">
      <div v-if="filtered.length === 0" class="empty-state">没有匹配的条目</div>
      <div class="tl" v-else>
        <div v-for="post in filtered" :key="post.id" class="tl-item" @click="selectPost(post.id)">
          <div class="tl-dot"></div>
          <div class="tl-card">
            <div class="tl-head">
              <span class="tl-date">{{ post.date }}</span>
              <span class="tl-title">{{ post.title }}</span>
            </div>
            <div class="tl-tags" v-if="post.tags.length">
              <span v-for="tag in post.tags" :key="tag" class="cookbook-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    selectPost(id) {
      this.$emit('select', id);
    }
  },
  computed: {
    filtered() {
      const q = (this.query || '').trim().toLowerCase();
      if (!q) return [...this.entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return this.entries
        .filter(e =>
          e.title.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        )
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
  }
};

/* ─── Cookbook Detail ─── */

const CookbookDetail = {
  props: ['entry'],
  emits: ['back'],
  template: `
    <div class="cookbook-detail">
      <button class="cookbook-back" @click="goBack">← 返回时间轴</button>
      <div v-if="entry" class="cookbook-card">
        <div class="cookbook-title">{{ entry.title }}</div>
        <div class="cookbook-meta">
          <span class="cookbook-date" v-if="entry.date">{{ entry.date }}</span>
          <span class="cookbook-tags" v-if="entry.tags && entry.tags.length">
            <span v-for="tag in entry.tags" :key="tag" class="cookbook-tag">{{ tag }}</span>
          </span>
        </div>
        <div class="cookbook-body" v-html="renderMd(entry.body)"></div>
      </div>
    </div>
  `,
  methods: {
    goBack() {
      this.$emit('back');
    },
    renderMd(md) {
      return marked.parse(md, { breaks: true, gfm: true });
    }
  }
};

/* ─── App ─── */

const app = createApp({
  data() {
    return {
      tabs: [
        { id: 'routes', title: '路由表', icon: '🗺️' },
        { id: 'calendar', title: '每日日历追踪', icon: '📅' },
        { id: 'expense', title: '支出记录', icon: '💰' },
        { id: 'cookbook', title: '个人开发时间线', icon: '🧑‍💻' },
        { id: 'valorant', title: '无畏契约', icon: '🎯' },
        { id: 'membership', title: '会员订阅', icon: '💳' }
      ],
      activeTab: 'routes',
      sidebarOpen: false,
      cookbookQuery: '',
      cookbookEntries: cookbookEntries,
      cookbookView: 'timeline',
      cookbookDetailId: null
    };
  },
  computed: {
    cookbookDetailEntry() {
      return this.cookbookEntries.find(e => e.id === this.cookbookDetailId) || null;
    }
  },
  methods: {
    renderMarkdown(md) {
      return marked.parse(md, { breaks: true, gfm: true });
    },
    switchTab(id) {
      this.activeTab = id;
      if (id === 'cookbook') {
        this.cookbookView = 'timeline';
        this.cookbookDetailId = null;
      }
      if (window.innerWidth < 720) this.sidebarOpen = false;
    },
    openDetail(id) {
      this.cookbookDetailId = id;
      this.cookbookView = 'detail';
    },
    closeDetail() {
      this.cookbookView = 'timeline';
      this.cookbookDetailId = null;
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
app.component('cookbook-timeline', CookbookTimeline);
app.component('cookbook-detail', CookbookDetail);
app.component('valorant-view', ValorantView);
app.component('membership-view', MembershipView);
app.mount('#app');
