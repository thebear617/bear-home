# Personal 站点 · 每日 Todo 看板 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 personal 站点新增一个多类别（🎬 视频 / 🔍 科研 / 💻 编程 / 🏠 生活）每日任务看板，包含 todo/doing/done 三列状态、日清模式、历史归档、响应式布局。

**Architecture:** 复用 personal 现有 Vue 3 全局构建架构。新增 `js/todo-data.js`（数据层）+ `js/components/TodoBoard.js`（组件），修改 `data.js`、`app.js`、`index.html`、`css/style.css` 完成接入。无构建步骤、无依赖、无测试。

**Tech Stack:** Vue 3 全局构建（自托管）、原生 CSS、纯静态站点。

**Spec:** `docs/superpowers/specs/2026-07-18-personal-todo-board-design.md`

**Repo:** personal 仓库根目录（所有 git 命令均在 personal/ 内执行）。

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `js/todo-data.js` | 新增 | 定义 `TODO_BOARDS` 全局变量 |
| `js/components/TodoBoard.js` | 新增 | `TodoBoard` Vue 组件（template + data + computed） |
| `js/data.js` | 修改 | 在 `tabs` 数组（app.js 内）新增 todo 项的元数据由 app.js 控制；本任务不在 data.js 改 |
| `js/app.js` | 修改 | 在 `tabs` 数组加 todo 项；注册 TodoBoard 组件 |
| `index.html` | 修改 | 加载 `js/todo-data.js`；模板加 `<todo-board v-show>` |
| `css/style.css` | 修改 | 新增 TodoBoard 全部样式（tab / column / card / history / 响应式） |

组件放置约定：复用项目内已存在的 `js/*.js` 平铺目录，不新增 `components/` 子目录，保持与现有 `app.js / data.js / valorant-data.js` 同级。

---

## Task 1: 创建 `js/todo-data.js` 数据层

**Files:**
- Create: `js/todo-data.js`

- [ ] **Step 1.1: 写入空数据骨架**

```js
// js/todo-data.js
// 任务看板数据层。TodoBoard 组件从这里读取 TODO_BOARDS。
// 字段约定见 docs/superpowers/specs/2026-07-18-personal-todo-board-design.md 第 4 节。
const TODO_BOARDS = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: []
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: []
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: []
  }
];
```

- [ ] **Step 1.2: 验证文件无语法错误**

Run: `node --check js/todo-data.js`
Expected: 退出码 0，无输出（Node 不会执行，只检查语法）

- [ ] **Step 1.3: 提交**

```bash
git add js/todo-data.js
git commit -m "init: 新增 Todo 看板数据层（空骨架，4 个 tab）"
```

---

## Task 2: 创建 `js/components/TodoBoard.js` 组件骨架

**Files:**
- Create: `js/components/TodoBoard.js`

- [ ] **Step 2.1: 写入最小可渲染骨架**

```js
// js/components/TodoBoard.js
// Todo 看板 Vue 3 组件。
// 完整功能分阶段实现，本任务只搭骨架：注册组件 + 显示标题 + "未加载"占位。
(function () {
  if (typeof Vue === 'undefined') {
    console.error('[TodoBoard] Vue 未加载。检查脚本顺序：vue.global.prod.js 必须在 todo-data.js 与 TodoBoard.js 之前加载。');
    return;
  }

  const TodoBoard = {
    template: `
      <div class="todo-board">
        <header class="todo-board-header">
          <h2 class="todo-board-title">📋 每日 Todo 看板</h2>
          <p class="todo-board-subtitle">骨架版（待实现）</p>
        </header>
        <div v-if="!boardsLoaded" class="todo-board-empty">
          看板数据未加载。请检查 js/todo-data.js 是否在 TodoBoard.js 之前加载。
        </div>
        <div v-else class="todo-board-placeholder">
          数据已加载：{{ boards.length }} 个 tab（骨架版未渲染 tab/列/卡片）
        </div>
      </div>
    `,
    data() {
      return {};
    },
    computed: {
      boardsLoaded() {
        return typeof TODO_BOARDS !== 'undefined' && Array.isArray(TODO_BOARDS);
      },
      boards() {
        return this.boardsLoaded ? TODO_BOARDS : [];
      }
    }
  };

  // 暴露到全局，供 app.js 注册
  window.TodoBoard = TodoBoard;
})();
```

- [ ] **Step 2.2: 验证文件无语法错误**

Run: `node --check js/components/TodoBoard.js`
Expected: 退出码 0，无输出

- [ ] **Step 2.3: 提交**

```bash
git add js/components/TodoBoard.js
git commit -m "init: 新增 TodoBoard 组件骨架（仅渲染标题与加载状态）"
```

---

## Task 3: 把 TodoBoard 接入 app.js 与 index.html

**Files:**
- Modify: `js/app.js`
- Modify: `index.html`

- [ ] **Step 3.1: 修改 `js/app.js`，在 `tabs` 数组加 todo 项**

在 `js/app.js` 第 679-685 行的 `tabs` 数组末尾追加一项：

找到：
```js
      tabs: [
        { id: 'routes', title: '路由表', icon: '🗺️' },
        { id: 'cookbook', title: '个人开发时间线', icon: '🧑‍💻' },
        { id: 'valorant', title: '无畏契约', icon: '🎯' },
        { id: 'lol', title: '英雄联盟', icon: '⚔️' },
        { id: 'membership', title: '会员订阅', icon: '💳' }
      ],
```

改为：
```js
      tabs: [
        { id: 'routes', title: '路由表', icon: '🗺️' },
        { id: 'cookbook', title: '个人开发时间线', icon: '🧑‍💻' },
        { id: 'valorant', title: '无畏契约', icon: '🎯' },
        { id: 'lol', title: '英雄联盟', icon: '⚔️' },
        { id: 'membership', title: '会员订阅', icon: '💳' },
        { id: 'todo', title: '每日看板', icon: '📋' }
      ],
```

- [ ] **Step 3.2: 在 `js/app.js` 注册 TodoBoard 组件**

在 `js/app.js` 第 741 行 `app.mount('#app');` 之前，找到：

```js
app.component('route-table', RouteTable);
app.component('cookbook-timeline', CookbookTimeline);
app.component('cookbook-detail', CookbookDetail);
app.component('valorant-view', ValorantView);
app.component('lol-view', LolView);
app.component('membership-view', MembershipView);
app.mount('#app');
```

在 `app.mount('#app');` 之前插入一行：

```js
app.component('route-table', RouteTable);
app.component('cookbook-timeline', CookbookTimeline);
app.component('cookbook-detail', CookbookDetail);
app.component('valorant-view', ValorantView);
app.component('lol-view', LolView);
app.component('membership-view', MembershipView);
app.component('todo-board', window.TodoBoard);
app.mount('#app');
```

- [ ] **Step 3.3: 修改 `index.html`，加入 `todo-data.js` 与 `<todo-board>` 元素**

找到 `index.html` 第 57-60 行：

```html
          <valorant-view v-show="activeTab === 'valorant'"></valorant-view>
          <lol-view v-show="activeTab === 'lol'"></lol-view>
          <membership-view v-show="activeTab === 'membership'"></membership-view>
        </main>
```

在 `<lol-view ...>` 与 `<membership-view ...>` 之间插入：

```html
          <lol-view v-show="activeTab === 'lol'"></lol-view>
          <todo-board v-show="activeTab === 'todo'"></todo-board>
          <membership-view v-show="activeTab === 'membership'"></membership-view>
```

找到 `index.html` 第 65-70 行（script 加载顺序）：

```html
  <script src="js/data.js"></script>
  <script src="js/valorant-data.js"></script>
  <script src="js/lol-data.js"></script>
  <script src="js/vendor/vue.global.prod.js"></script>
  <script src="js/vendor/marked.min.js"></script>
  <script src="js/app.js"></script>
```

在 `js/data.js` 之后插入 `js/todo-data.js`（与 data.js 同级，因为不依赖 Vue，只声明全局变量）：

```html
  <script src="js/data.js"></script>
  <script src="js/todo-data.js"></script>
  <script src="js/valorant-data.js"></script>
  <script src="js/lol-data.js"></script>
  <script src="js/vendor/vue.global.prod.js"></script>
  <script src="js/vendor/marked.min.js"></script>
  <script src="js/app.js"></script>
```

- [ ] **Step 3.4: 浏览器手动验证**

Run:
```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。

Expected:
- 侧边栏底部出现新的「📋 每日看板」Tab
- 点击切换到 todo tab，页面显示「📋 每日 Todo 看板」标题与「骨架版（待实现）」副标题
- 主视图下方显示「数据已加载：4 个 tab」
- 打开 DevTools Console，无报错

- [ ] **Step 3.5: 提交**

```bash
git add js/app.js index.html
git commit -m "feat: 接入 TodoBoard 组件，新增「每日看板」侧边栏入口"
```

---

## Task 4: 实现 tab 切换

**Files:**
- Modify: `js/components/TodoBoard.js`

- [ ] **Step 4.1: 替换 template 顶部为 tab 区**

将 Task 2.1 写入的整个 `template` 字符串替换为：

```js
    template: `
      <div class="todo-board">
        <header class="todo-board-header">
          <div class="todo-board-date">
            <span class="todo-board-date-icon">📅</span>
            <span class="todo-board-date-text">{{ todayText }}</span>
          </div>
          <button
            class="todo-board-history-toggle"
            type="button"
            @click="historyOpen = !historyOpen"
          >
            📜 查看历史 {{ historyOpen ? '▴' : '▾' }}
          </button>
        </header>

        <nav class="todo-board-tabs" aria-label="看板分类">
          <button
            v-for="board in boards"
            :key="board.id"
            type="button"
            class="todo-board-tab"
            :class="{ active: activeTabId === board.id }"
            @click="activeTabId = board.id"
          >
            <span class="todo-board-tab-icon">{{ board.icon }}</span>
            <span class="todo-board-tab-name">{{ board.name }}</span>
          </button>
        </nav>

        <div v-if="!boardsLoaded" class="todo-board-empty">
          看板数据未加载。请检查 js/todo-data.js 是否在 TodoBoard.js 之前加载。
        </div>
        <div v-else class="todo-board-placeholder">
          当前 tab：{{ activeTabId }}（骨架版未渲染列/卡片，下一步实现）
        </div>
      </div>
    `,
```

- [ ] **Step 4.2: 在 `data()` 加 `activeTabId` 与 `historyOpen`**

将 `data()` 改为：

```js
    data() {
      return {
        activeTabId: 'video',
        historyOpen: false
      };
    },
```

- [ ] **Step 4.3: 在 `computed` 加 `todayText`**

在 `computed` 内 `boards` 之后追加：

```js
    computed: {
      boardsLoaded() {
        return typeof TODO_BOARDS !== 'undefined' && Array.isArray(TODO_BOARDS);
      },
      boards() {
        return this.boardsLoaded ? TODO_BOARDS : [];
      },
      todayText() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}（今天）`;
      }
    }
```

- [ ] **Step 4.4: 验证**

刷新 `http://localhost:8000/` 切到「📋 每日看板」tab。

Expected:
- 顶部显示「📅 2026-07-18（今天）」+「📜 查看历史 ▾」按钮
- 下方出现 4 个 tab：🎬 视频 / 🔍 科研 / 💻 编程 / 🏠 生活
- 「🎬 视频」默认高亮（active 样式）
- 点击其他 tab，active 状态切换，下方显示「当前 tab：xxx」跟随变化

- [ ] **Step 4.5: 提交**

```bash
git add js/components/TodoBoard.js
git commit -m "feat: TodoBoard 新增 tab 切换、日期头部、历史入口按钮（骨架）"
```

---

## Task 5: 实现三列状态过滤

**Files:**
- Modify: `js/components/TodoBoard.js`

- [ ] **Step 5.1: 在 `computed` 加 `todayStr`、`activeBoard`、`todoItems`、`doingItems`、`doneItems`**

将 `computed` 整段替换为：

```js
    computed: {
      boardsLoaded() {
        return typeof TODO_BOARDS !== 'undefined' && Array.isArray(TODO_BOARDS);
      },
      boards() {
        return this.boardsLoaded ? TODO_BOARDS : [];
      },
      todayText() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}（今天）`;
      },
      todayStr() {
        return this.todayText.split('（')[0];
      },
      activeBoard() {
        return this.boards.find(b => b.id === this.activeTabId) || null;
      },
      allItems() {
        return this.activeBoard ? (this.activeBoard.items || []) : [];
      },
      todoItems() {
        // 待办：date == 今天 AND status == 'todo'
        return this.allItems.filter(it => {
          const status = it.status || 'todo';
          const date = it.date || this.todayStr;
          return status === 'todo' && date === this.todayStr;
        });
      },
      doingItems() {
        // 进行中：status == 'doing'（含跨天）
        return this.allItems.filter(it => (it.status || 'todo') === 'doing');
      },
      doneItems() {
        // 已完成：date == 今天 AND status == 'done'
        return this.allItems.filter(it => {
          const status = it.status || 'todo';
          const date = it.date || this.todayStr;
          return status === 'done' && date === this.todayStr;
        });
      }
    }
```

- [ ] **Step 5.2: 在 template 把占位文字替换为三列骨架**

把 template 中 `<div v-else class="todo-board-placeholder">` 整块（从 `<div v-else` 到对应 `</div>`）替换为：

```html
        <div v-if="!boardsLoaded" class="todo-board-empty">
          看板数据未加载。请检查 js/todo-data.js 是否在 TodoBoard.js 之前加载。
        </div>
        <div v-else-if="activeBoard" class="todo-board-columns">
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-todo">
              <span class="todo-board-column-dot"></span>
              待办 <span class="todo-board-column-count">{{ todoItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="todoItems.length === 0" class="todo-board-empty">还没有 todo</p>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-doing">
              <span class="todo-board-column-dot"></span>
              进行中 <span class="todo-board-column-count">{{ doingItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doingItems.length === 0" class="todo-board-empty">还没有进行中</p>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-done">
              <span class="todo-board-column-dot"></span>
              已完成 <span class="todo-board-column-count">{{ doneItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doneItems.length === 0" class="todo-board-empty">还没有完成</p>
            </div>
          </div>
        </div>
```

- [ ] **Step 5.3: 验证**

刷新页面，切到 todo tab。

Expected:
- 三列标题：「待办 / 进行中 / 已完成」，每列右侧数字徽章显示 `0`
- 每列正文显示「还没有 todo / 还没有进行中 / 还没有完成」占位文字
- 切换 tab 仍然正常

- [ ] **Step 5.4: 提交**

```bash
git add js/components/TodoBoard.js
git commit -m "feat: TodoBoard 三列过滤逻辑 + 占位文字"
```

---

## Task 6: 实现卡片渲染

**Files:**
- Modify: `js/components/TodoBoard.js`

- [ ] **Step 6.1: 在 template 中三个 column-body 里加上 `v-for` 渲染卡片**

把 Task 5.2 的 template 中三列 `<div class="todo-board-column-body">` 整段替换为：

```html
        <div v-else-if="activeBoard" class="todo-board-columns">
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-todo">
              <span class="todo-board-column-dot"></span>
              待办 <span class="todo-board-column-count">{{ todoItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="todoItems.length === 0" class="todo-board-empty">还没有 todo</p>
              <article
                v-for="item in todoItems"
                :key="item.id"
                class="todo-card"
              >
                <h3 class="todo-card-title">{{ item.title }}</h3>
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="todo-card-url">🔗 {{ shortUrl(item.url) }}</a>
                <p v-if="item.note" class="todo-card-note">{{ item.note }}</p>
                <div v-if="item.createdAt" class="todo-card-meta">创建：{{ item.createdAt }}</div>
              </article>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-doing">
              <span class="todo-board-column-dot"></span>
              进行中 <span class="todo-board-column-count">{{ doingItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doingItems.length === 0" class="todo-board-empty">还没有进行中</p>
              <article
                v-for="item in doingItems"
                :key="item.id"
                class="todo-card todo-card-doing"
              >
                <h3 class="todo-card-title">{{ item.title }}</h3>
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="todo-card-url">🔗 {{ shortUrl(item.url) }}</a>
                <p v-if="item.note" class="todo-card-note">{{ item.note }}</p>
                <div v-if="item.createdAt" class="todo-card-meta">创建：{{ item.createdAt }} <span v-if="item.date && item.date !== todayStr" class="todo-card-crossday">（跨天）</span></div>
              </article>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-done">
              <span class="todo-board-column-dot"></span>
              已完成 <span class="todo-board-column-count">{{ doneItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doneItems.length === 0" class="todo-board-empty">还没有完成</p>
              <article
                v-for="item in doneItems"
                :key="item.id"
                class="todo-card todo-card-done"
              >
                <h3 class="todo-card-title">{{ item.title }}</h3>
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="todo-card-url">🔗 {{ shortUrl(item.url) }}</a>
                <p v-if="item.note" class="todo-card-note">{{ item.note }}</p>
                <div v-if="item.createdAt" class="todo-card-meta">创建：{{ item.createdAt }}</div>
              </article>
            </div>
          </div>
        </div>
```

- [ ] **Step 6.2: 在 `methods` 里加 `shortUrl`**

在 `computed` 之后（`methods` 之前，整个组件对象内），增加 `methods` 块。如果原本没有 `methods`，插入；如果已有 `methods: {}`，把内容改为：

```js
    methods: {
      shortUrl(url) {
        if (!url) return '';
        try {
          const u = new URL(url);
          return u.hostname + (u.pathname !== '/' ? u.pathname : '');
        } catch (e) {
          return url;
        }
      }
    }
```

- [ ] **Step 6.3: 验证（用临时测试数据）**

临时给 `js/todo-data.js` 的 video tab 加 1 条 todo：

找到：
```js
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: []
  },
```

改为：
```js
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v-test', title: '测试视频卡片', url: 'https://b23.tv/1RotOy9', status: 'todo', note: '临时测试', createdAt: '2026-07-18', date: '2026-07-18' }
    ]
  },
```

刷新页面，切到 todo tab → 🎬 视频 tab。

Expected:
- 「待办」列出现 1 张卡片：「测试视频卡片」+「🔗 b23.tv/1RotOy9」+ 灰色「临时测试」+ 右下「创建：2026-07-18」

- [ ] **Step 6.4: 还原测试数据**

把 `js/todo-data.js` 还原回 `items: []`。

- [ ] **Step 6.5: 提交**

```bash
git add js/components/TodoBoard.js
git commit -m "feat: TodoBoard 卡片渲染（title/url/note/createdAt）"
```

---

## Task 7: 实现历史归档面板

**Files:**
- Modify: `js/components/TodoBoard.js`

- [ ] **Step 7.1: 在 `computed` 加 `historyGroups`**

在 `doneItems` 之后追加：

```js
      historyGroups() {
        // 历史 = date < 今天 AND status == 'done'，按 board 分组再按 date 倒序
        if (!this.boardsLoaded) return [];
        const groups = [];
        this.boards.forEach(board => {
          const past = (board.items || []).filter(it => {
            const status = it.status || 'todo';
            const date = it.date || this.todayStr;
            return status === 'done' && date < this.todayStr;
          });
          if (past.length > 0) {
            const byDate = {};
            past.forEach(it => {
              const d = it.date || this.todayStr;
              if (!byDate[d]) byDate[d] = [];
              byDate[d].push(it);
            });
            Object.keys(byDate).sort((a, b) => b.localeCompare(a)).forEach(date => {
              groups.push({
                boardId: board.id,
                boardIcon: board.icon,
                boardName: board.name,
                date,
                items: byDate[date]
              });
            });
          }
        });
        return groups;
      }
```

- [ ] **Step 7.2: 在 template `</nav>` 之后、`columns` 之前插入历史面板**

找到：
```html
        </nav>

        <div v-if="!boardsLoaded" class="todo-board-empty">
```

在 `</nav>` 与 `<div v-if="!boardsLoaded">` 之间插入：

```html
        </nav>

        <section v-if="historyOpen" class="todo-board-history" aria-label="已完成历史">
          <h3 class="todo-board-history-title">📜 已完成历史</h3>
          <p v-if="historyGroups.length === 0" class="todo-board-empty">还没有历史归档</p>
          <div
            v-for="group in historyGroups"
            :key="group.boardId + '-' + group.date"
            class="todo-board-history-group"
          >
            <details>
              <summary>
                <span class="todo-board-history-date">{{ group.date }}</span>
                <span class="todo-board-history-meta">{{ group.boardIcon }} {{ group.boardName }} · {{ group.items.length }} 条</span>
              </summary>
              <ul class="todo-board-history-list">
                <li v-for="item in group.items" :key="item.id" class="todo-board-history-item">
                  {{ item.title }}
                  <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="todo-card-url">🔗 {{ shortUrl(item.url) }}</a>
                </li>
              </ul>
            </details>
          </div>
        </section>

        <div v-if="!boardsLoaded" class="todo-board-empty">
```

- [ ] **Step 7.3: 验证（临时构造历史数据）**

在 `js/todo-data.js` 的 video tab 加一条 done 的历史项：

```js
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v-hist', title: '已归档示例', url: '', status: 'done', note: '', createdAt: '2026-07-15', date: '2026-07-15' }
    ]
  },
```

刷新页面，点 todo tab，点「📜 查看历史」按钮。

Expected:
- 历史面板展开，显示「📜 已完成历史」标题
- 出现 `2026-07-15` 一行：「🎬 视频 · 1 条」
- 点击展开显示「已归档示例」

- [ ] **Step 7.4: 还原**

把 `js/todo-data.js` 还原回 `items: []`。

- [ ] **Step 7.5: 提交**

```bash
git add js/components/TodoBoard.js
git commit -m "feat: TodoBoard 历史归档面板（按 board + date 倒序）"
```

---

## Task 8: 写 TodoBoard 全部样式

**Files:**
- Modify: `css/style.css`

- [ ] **Step 8.1: 在 `css/style.css` 文件末尾追加所有 TodoBoard 样式**

```css
/* ─── TodoBoard 看板 ─── */

.todo-board {
  padding: 24px 28px 60px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #2f2924;
}

.todo-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.todo-board-date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2f2924;
}

.todo-board-date-icon {
  font-size: 18px;
}

.todo-board-history-toggle {
  background: #ffffff;
  border: 1px solid #e7dfd3;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 14px;
  color: #2f2924;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.todo-board-history-toggle:hover {
  background: #fbf6ee;
  border-color: #c2410c;
}

.todo-board-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e7dfd3;
  margin-bottom: 20px;
  overflow-x: auto;
}

.todo-board-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 18px;
  font-size: 15px;
  color: #5a4f44;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.todo-board-tab:hover {
  color: #c2410c;
}

.todo-board-tab.active {
  color: #c2410c;
  border-bottom-color: #c2410c;
  font-weight: 600;
}

.todo-board-empty {
  color: #9a8e80;
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
  font-style: italic;
}

.todo-board-placeholder {
  color: #9a8e80;
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}

.todo-board-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.todo-board-column {
  background: #fbf6ee;
  border: 1px solid #e7dfd3;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 240px;
}

.todo-board-column-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e7dfd3;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
}

.todo-board-column-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.todo-status-todo .todo-board-column-dot { background: #94a3b8; }
.todo-status-doing .todo-board-column-dot { background: #c2410c; }
.todo-status-done .todo-board-column-dot { background: #6b7280; }

.todo-board-column-count {
  margin-left: auto;
  background: #f7f3ee;
  color: #5a4f44;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}

.todo-board-column-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.todo-card {
  background: #ffffff;
  border: 1px solid #e7dfd3;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.todo-card:hover {
  box-shadow: 0 2px 8px rgba(47, 41, 36, 0.08);
  transform: translateY(-1px);
}

.todo-card-doing {
  border-left: 3px solid #c2410c;
}

.todo-card-done {
  opacity: 0.65;
}

.todo-card-done .todo-card-title {
  text-decoration: line-through;
  color: #6b7280;
}

.todo-card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #2f2924;
  line-height: 1.4;
}

.todo-card-url {
  font-size: 12px;
  color: #c2410c;
  text-decoration: none;
  word-break: break-all;
}

.todo-card-url:hover {
  text-decoration: underline;
}

.todo-card-note {
  font-size: 12px;
  color: #5a4f44;
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.todo-card-meta {
  font-size: 11px;
  color: #9a8e80;
  margin-top: 2px;
}

.todo-card-crossday {
  color: #c2410c;
  margin-left: 4px;
  font-weight: 500;
}

/* 历史面板 */
.todo-board-history {
  background: #ffffff;
  border: 1px solid #e7dfd3;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.todo-board-history-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #2f2924;
}

.todo-board-history-group {
  margin-bottom: 8px;
}

.todo-board-history-group details {
  border-radius: 8px;
  background: #fbf6ee;
}

.todo-board-history-group summary {
  cursor: pointer;
  padding: 8px 12px;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  border-radius: 8px;
}

.todo-board-history-group summary::-webkit-details-marker { display: none; }
.todo-board-history-group summary::before {
  content: '▸';
  color: #9a8e80;
  font-size: 10px;
  transition: transform 0.15s ease;
}
.todo-board-history-group details[open] summary::before {
  transform: rotate(90deg);
}

.todo-board-history-date {
  font-weight: 600;
  color: #2f2924;
}

.todo-board-history-meta {
  color: #9a8e80;
  font-size: 12px;
}

.todo-board-history-list {
  list-style: none;
  margin: 0;
  padding: 0 12px 12px 32px;
}

.todo-board-history-item {
  padding: 4px 0;
  font-size: 13px;
  color: #5a4f44;
}

/* 响应式 */
@media (max-width: 768px) {
  .todo-board {
    padding: 16px 12px 40px;
  }
  .todo-board-columns {
    grid-template-columns: 1fr;
  }
  .todo-board-history-group summary {
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 8.2: 验证**

刷新 todo tab。

Expected:
- 三列看板布局美观，圆角卡片，hover 抬升阴影
- 进行中卡片左边框暖橙
- 已完成卡片半透明 + 标题划线
- 历史面板可折叠展开
- 移动端宽度（DevTools 切到 375px）三列堆叠为一列

- [ ] **Step 8.3: 提交**

```bash
git add css/style.css
git commit -m "feat: TodoBoard 全部样式 + 移动端响应式"
```

---

## Task 9: 写入初始数据（reminder-today 3 条视频）

**Files:**
- Modify: `js/todo-data.js`

- [ ] **Step 9.1: 把 3 条视频 todo 加入 `video` tab**

把 `js/todo-data.js` 改为：

```js
// js/todo-data.js
// 任务看板数据层。TodoBoard 组件从这里读取 TODO_BOARDS。
// 字段约定见 docs/superpowers/specs/2026-07-18-personal-todo-board-design.md 第 4 节。
//
// 初始数据迁移（2026-07-18）：从 ~/.hermes/reminder-today.md「待转录视频」一节迁入。
// 详见 spec 第 12 节。
const TODO_BOARDS = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v1', title: '世界模型：在 AI 里抛硬币，概率是 50% 吗？', url: 'https://b23.tv/1RotOy9', status: 'todo', note: '预计归 lifenotes/AI产业', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v2', title: '中科院研究生如何用 AI 把 idea 一步步变成论文', url: 'https://www.bilibili.com/video/BV1LKjS6gEh4/', status: 'todo', note: '预计归 reanotes/literature', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v3', title: 'GPT-5.6 + image2 三步法输出高质量学术 PPT', url: 'https://www.bilibili.com/video/BV1mgNj6MEuX/', status: 'todo', note: '预计归 reanotes/dlproject', createdAt: '2026-07-18', date: '2026-07-18' }
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: []
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: []
  }
];
```

- [ ] **Step 9.2: 验证**

刷新 todo tab → 🎬 视频。

Expected:
- 「待办」列显示 3 张卡片，每张含标题、B站链接、灰色 note、右下创建日期
- 「进行中」与「已完成」列空，显示占位文字

- [ ] **Step 9.3: 提交**

```bash
git add js/todo-data.js
git commit -m "init: 从 reminder-today 迁入 3 条视频 todo 到 video tab"
```

---

## Task 10: 端到端验证

- [ ] **Step 10.1: 主路径走查**

Run:
```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。依次验证：

1. 侧边栏点「📋 每日看板」→ 进入 todo tab，标题、日期、tab 区渲染正确
2. 默认 🎬 视频 tab 显示 3 张视频 todo 卡片
3. 切到 🔍 科研 / 💻 编程 / 🏠 生活 tab → 各列显示「还没有 xxx」占位
4. 切回 🎬 视频 tab → 3 张卡片仍在
5. 点「📜 查看历史」→ 展开历史面板，显示「还没有历史归档」（因为没有 done 的历史项）
6. 切到其他 tab（路由表 / cookbook / valorant / lol / membership）→ 各 tab 正常显示，无回归
7. DevTools Console 全程无报错

- [ ] **Step 10.2: 边界场景走查**

临时在 video tab 加一条跨天 doing 数据（验证 doing 列跨天行为）：

在 `js/todo-data.js` video items 末尾追加：
```js
      { id: 'v-cross', title: '（测试）跨天进行中卡片', url: '', status: 'doing', note: '', createdAt: '2026-07-17', date: '2026-07-17' }
```

刷新 video tab：

Expected:
- 「进行中」列出现 1 张卡片，标题右侧带「（跨天）」标记
- 「待办」与「已完成」列不变

- [ ] **Step 10.3: 边界场景走查（历史）**

把刚才那条 `v-cross` 改成 `status: 'done', date: '2026-07-17'`。

刷新：

Expected:
- 视频 tab 的「已完成」列空（因为 date != 今天）
- 「📜 查看历史」面板展开后出现 `2026-07-17` 一行：「🎬 视频 · 1 条」

- [ ] **Step 10.4: 还原 + 提交测试数据**

把 `v-cross` 从 `js/todo-data.js` 删除，恢复到 Task 9.1 的最终状态。

```bash
git diff js/todo-data.js
# 确认无 v-cross 残留
git status --short
```

Expected: 没有任何 diff（`js/todo-data.js` 已回到 Task 9.1 的版本）

---

## Task 11: 部署到 GitHub Pages

- [ ] **Step 11.1: 检查工作树**

```bash
git status --short
```

Expected: 工作树干净，无未提交改动（Task 10.4 已还原）

- [ ] **Step 11.2: 推送到远程 main**

```bash
git push origin main
```

Expected: 推送成功，GitHub Pages 在 ~30 秒后生效

- [ ] **Step 11.3: 线上验证**

打开 `https://me.thebear617.cn/`（personal 的 GitHub Pages 地址）。

依次验证 Task 10.1 的 7 步，所有行为与本地一致。

- [ ] **Step 11.4: 更新 CHANGELOG（如项目有约定）**

检查是否有 CHANGELOG.md 约定。看 `git log --oneline | head -10` 看 commit 风格，按需要追加一行。

---

## Task 12: 收尾

- [ ] **Step 12.1: 删除 reminder-today.md 的「待转录视频」一节**

打开 `~/.hermes/reminder-today.md`，删除「3. 待转录视频」整个子节（从 `3. 待转录视频：` 到该子节结束）。

- [ ] **Step 12.2: 标记 spec 完成**

在 `docs/superpowers/specs/2026-07-18-personal-todo-board-design.md` 顶部状态行「状态：待用户审阅」改为「状态：已实施」。

```bash
git add docs/superpowers/specs/2026-07-18-personal-todo-board-design.md
git commit -m "docs: 标记 spec 状态为已实施"
git push origin main
```

---

## Self-Review Checklist

完成计划后，逐项对照检查：

1. **Spec 覆盖**：
   - §3 架构（5 文件）→ Task 1/2/3/8/9 ✓
   - §4 数据模型（TODO_BOARDS / TODO_ITEM 字段）→ Task 1/9 ✓
   - §5 视图与交互（主视图、三列规则、跨天 doing、历史归档）→ Task 4/5/6/7 ✓
   - §6 路由（routeCategories + tabs + hash）→ Task 3 ✓
   - §7 视觉样式（色板、布局、响应式）→ Task 8 ✓
   - §8 变更流 → 每个 Task 末尾的 git commit ✓
   - §9 错误处理（status 非法 / date 缺失 / TODO_BOARDS undefined）→ Task 5/2 ✓
   - §12 初始数据迁移 → Task 9 ✓

2. **占位扫描**：无 TBD/TODO/「类似 Task N」。每步都有完整代码或精确命令。

3. **类型一致性**：
   - `TODO_BOARDS` 在 Task 1 定义、Task 2 读取、Task 7 扩展、Task 9 写入——命名一致
   - `todayStr`、`todayText`、`activeBoard`、`activeTabId`、`todoItems`、`doingItems`、`doneItems`、`historyGroups` 全在 Task 5/7 中定义并在 template 中正确引用
   - `shortUrl` 在 Task 6.2 定义，在 Task 6.1 与 7.2 的 template 中调用