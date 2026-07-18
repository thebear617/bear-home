# Personal 站点 · 每日 Todo 看板 · 设计文档

- 日期：2026-07-18
- 状态：待用户审阅
- 适用版本：personal 站点当前 main 分支

## 1. 目标

在 personal 站点（熊窝 · 个人主页）新增一个 **多类别每日任务看板**，替换当前散落在 `~/.hermes/reminder-today.md` 里的临时待办。特性：

- 4 个分类 tab：**🎬 视频 / 🔍 科研 / 💻 编程 / 🏠 生活**
- 每个 tab 内三列状态：**待办 / 进行中 / 已完成**
- 默认 **日清模式**：主视图只显示今天 + 跨天进行中；历史 done 自动归档
- 不依赖 lifenotes / reanotes 状态，纯本机维护
- 复用 personal 现有架构（Vue 3 全局构建 + 全局变量数据 + 无构建步骤）

## 2. 范围

### 范围内

- 在 personal 站点新增 TodoBoard 视图及配套数据/路由
- 改造 reminder-today.md 的"待办区"使用习惯（迁移、不是自动同步）
- 多类垂直看板、tab 切换、三列状态展示
- 日清模式 + 历史归档（纯渲染时筛选，无需 git 操作）

### 范围外

- 拖拽切换状态（不做，等 todo 数量增多后再评估）
- localStorage 状态缓存（不做，状态变更走 git 提交）
- 跨站点自动联动（lifenotes / reanotes inbox 不参与）
- 用户登录、多设备同步（personal 本来就是个人主页，单机为主）
- 测试套件（personal 无现有测试，保持零依赖风格）

## 3. 架构概览

新增 2 个文件、修改 3 个现有文件：

| 文件 | 操作 | 用途 |
|------|------|------|
| `js/todo-data.js` | 新增 | 全局变量 `TODO_BOARDS`（数据层） |
| `js/components/TodoBoard.js` | 新增 | Vue 3 全局组件 |
| `js/data.js` | 修改 | `routeCategories` 追加 todo 项 |
| `js/app.js` | 修改 | 注册 TodoBoard 组件并接入路由 |
| `index.html` | 修改 | 加载 `todo-data.js`、渲染 `TodoBoard` |

**脚本加载顺序**（沿用 personal 约定）：

```
vue.global.prod.js → todo-data.js → data.js → app.js
```

`todo-data.js` 必须先于 `app.js` 加载，因为 `TodoBoard` 组件会读取 `TODO_BOARDS`。

## 4. 数据模型

### 4.1 `TODO_BOARDS`（全局变量，`js/todo-data.js`）

```js
const TODO_BOARDS = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v1', title: '世界模型：在 AI 里抛硬币', url: 'https://b23.tv/1RotOy9', status: 'todo', note: '预计归 lifenotes/AI产业', createdAt: '2026-07-18', date: '2026-07-18' }
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
]
```

### 4.2 `TODO_ITEM` 字段

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | ✅ | string | 稳定标识（如 `v1` / `r1`），避免重命名错位 |
| `title` | ✅ | string | 显示标题 |
| `url` | ❌ | string | 原始链接，渲染为可点击 |
| `status` | ✅ | `'todo'` \| `'doing'` \| `'done'` | 状态；非法值视为 `todo` 并 console.warn |
| `note` | ❌ | string | 一句话备注（如「预计归 lifenotes/AI产业」） |
| `createdAt` | ❌ | string (ISO date) | 创建日期，用于排序 |
| `date` | ❌ | string (`YYYY-MM-DD`) | 归属日期（日清模式用） |

### 4.3 排序与默认值

- 每个 tab 内的 items 按 `createdAt` 倒序展示（最新在前）
- `status` 字段缺失或非法 → 默认 `'todo'`
- 空 items 的 tab → 三列渲染为空看板，列内显示「还没有 todo」占位文字

## 5. 视图与交互

### 5.1 主视图（默认进入 `#todo`）

```
┌──────────────────────────────────────────────────┐
│  📅 2026-07-18（今天）        [📜 查看历史 ▾]    │
├──────────────────────────────────────────────────┤
│  [🎬 视频] [🔍 科研] [💻 编程] [🏠 生活]         │
│                                                  │
│  ┌─ 待办 ─┐  ┌─ 进行中 ─┐  ┌─ 已完成 ─┐         │
│  │        │  │ (含跨天)  │  │          │         │
│  │ 卡片   │  │ 卡片     │  │ 卡片     │         │
│  │        │  │          │  │          │         │
│  └────────┘  └──────────┘  └──────────┘         │
└──────────────────────────────────────────────────┘
```

### 5.2 三列填充规则（渲染时计算）

- **待办**：`date == 今天 AND status == 'todo'`
- **进行中**：`status == 'doing'`（包括跨天的——昨天开始做还没完成的会停留在此列，直到手动标 done 或改回 todo）
- **已完成**：`date == 今天 AND status == 'done'`

### 5.3 历史归档（纯渲染时筛选）

- `date < 今天 AND status == 'done'` → 自动归到历史区，不出现在主视图
- 点击顶部「📜 查看历史」展开历史面板：按 date 倒序列出每天的小型 board（只读，不可编辑）
- 历史面板不需要 git 操作，由组件根据 `date` 字段过滤

### 5.4 跨天 doing 行为

- doing 状态的卡片保留原 `date`（如 `date: '2026-07-17'`）
- 在「进行中」列持续展示直到手动改 status
- 不强制每天重置，不自动过期

## 6. 路由

### 6.1 `routeCategories` 增量（`js/data.js`）

```js
{ id: 'todo', name: '📋 看板', icon: '📋' }
```

### 6.2 触发逻辑

- URL hash 改为 `#todo` → 渲染 `<todo-board>` 组件
- 现有 RouteTable / Cookbook / Valorant / Membership 路由保持不变
- 进入 personal 站点时如果 hash 为空 → 沿用现有默认页行为，不强制跳到 todo

### 6.3 入口位置

- 顶部 nav bar 的 tab 列表里增加「📋 看板」
- 点击 → URL hash 切到 `#todo`

## 7. 视觉与样式

### 7.1 色板（沿用 personal 现有 token）

| 用途 | 颜色 |
|------|------|
| 主背景 | `#f7f3ee`（米黄） |
| 卡片 | `#ffffff` + `border-radius: 12px` + 轻阴影 |
| 状态色：todo | `#94a3b8`（中性灰，小圆点） |
| 状态色：doing | `#c2410c`（暖橙，左边框高亮） |
| 状态色：done | `#6b7280`（划线 + 半透明） |

### 7.2 布局细节

- 顶部 tab 区：横向 flex，active tab 加底部暖橙下划线（与现有 RouteTable tab 风格一致）
- 三列看板：CSS Grid `grid-template-columns: repeat(3, 1fr)`，列间距 16px
- 卡片内容：title（粗体）+ url（截断可点击，外链图标）+ note（小灰字斜体）+ `createdAt`（右下小灰字）
- 历史面板：折叠展开式，每行 `2026-07-17 ▾`，展开后是该日 mini board（只读）

### 7.3 响应式

- ≥768px：三列横排
- <768px：横向滚动（每列 `min-width: 280px`），或改为单列堆叠（每列标题 + 卡片列表纵向）

## 8. 变更流

### 8.1 加新 todo

```bash
# 1. 编辑 js/todo-data.js
# 2. 在对应 tab 的 items 数组追加：
#    { id, title, url, status: 'todo', note, createdAt: 今日, date: 今日 }
# 3. 提交
cd personal
git add js/todo-data.js
git commit -m "chore: 新增 todo - <标题>"
git push origin main
```

### 8.2 切换状态

- 修改 `status` 字段：`'todo'` ↔ `'doing'` ↔ `'done'`
- 同样走 git 提交流程

### 8.3 归档

- 不需要操作；done 卡片在 `date < 今天` 时自动归到历史区（渲染时筛选）

## 9. 错误处理

| 场景 | 行为 |
|------|------|
| `TODO_BOARDS` 未定义 | 组件渲染「看板数据未加载」提示，控制台报错 |
| `status` 非法值 | 视为 `todo`，控制台 `console.warn` 提示 |
| `date` 字段缺失 | 视为今天（与不写 `date` 等价） |
| `items` 为空数组 | 渲染空看板 + 「还没有 todo」占位文字 |
| `url` 缺失 | 卡片不显示外链图标 |
| `todo-data.js` 加载顺序错乱 | 组件读取 `TODO_BOARDS` 为 undefined，走"未加载"分支 |

## 10. 已知限制 / 后续可扩展

- **手动 git 提交改状态**：频繁切换状态的场景会显得重；如未来需要，可升级为 localStorage 缓存（无需 git 即可切状态）
- **无拖拽**：当前通过修改 `status` 字段切换；如未来需要类 Trello 体验，可引入 SortableJS
- **无提醒/通知**：不做，到时间完成的卡片不会自动提示
- **无统计/复盘**：不做，如需要「本周 done 数」等可后续加

## 11. 决策记录

| 决策 | 选项 | 选定 | 理由 |
|------|------|------|------|
| 集成层级 | A/B/C/D | A. 替换 reminder-today 的视频部分 | 与 reminder 解耦，更可控 |
| 站点归属 | lifenotes / reanotes / personal | personal | 长期 todo 放个人主页更自然 |
| 联动程度 | 联动 / 不联动 | 不联动 | 保持 personal 独立性 |
| tab 类别 | 单类 / 多类 / 混合 | 多类垂直（4 tab） | 视频/科研/编程/生活各自独立 |
| 视图形态 | 列表 / 看板 | 看板（todo/doing/done） | 状态视图比线性列表更直观 |
| 时间模式 | 累积 / 每日归档 / 日清 | 日清 + 历史归档 | 保持每日清爽，又能回溯 |
| 拖拽 | 有 / 无 | 无 | 当前 todo 数量少，需求不强 |
| 状态持久化 | git / localStorage | git | 单一数据源，多设备靠 git 同步 |