# 熊窝 · 个人主页

线上地址：<https://me.thebear617.cn/>

仓库：<https://github.com/thebear617/bear-home>（GitHub Pages + 自定义域名）

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | **Astro 7**（静态构建） |
| 客户端交互 | Astro 组件内的原生浏览器 JavaScript；当前活动页面不依赖 Vue |
| 样式 | 暖色调设计 token：米黄背景 `#f4ecdf`、深棕侧栏 `#2f2924` |
| 构建 | Astro 输出 `dist/`，由 GitHub Actions 部署到 GitHub Pages |

## 页面结构

当前站点的页面入口由 [src/components/SiteSidebar.astro](src/components/SiteSidebar.astro) 统一维护。

| URL | 页面 | Astro 入口 |
|-----|------|------------|
| `/` | 路由表 | `src/pages/index.astro` |
| `/routes/` | 路由表 | `src/pages/routes/index.astro` |
| `/dashboard/` | 生活仪表盘 | `src/pages/dashboard/index.astro` |
| `/todo-board/` | 任务看板 | `src/pages/todo-board/index.astro` |

根路径和 `/routes/` 当前渲染同一个路由表。侧栏导航使用显式的 `index.html` 相对链接，以兼容本地静态路由和 GitHub Pages 子路径环境。

## 目录结构

```text
personal/
├── astro.config.mjs             # Astro 配置与追踪快照同步接口
├── package.json                 # npm 脚本与依赖
├── .githooks/pre-push           # 推送前校验追踪快照
├── scripts/
│   ├── install-hooks.sh         # 启用仓库内 Git hooks
│   ├── migrate-tracker-snapshot.mjs # 按当前目标配置迁移旧快照
│   └── validate-tracker-snapshot.mjs # 校验快照结构和目标配置
├── src/
│   ├── layouts/SiteLayout.astro       # 通用布局：侧栏 + 主区
│   ├── pages/
│   │   ├── index.astro                # 根路径路由表
│   │   ├── routes/index.astro         # /routes/ 路由表
│   │   ├── dashboard/index.astro      # /dashboard/ 生活仪表盘
│   │   └── todo-board/index.astro     # /todo-board/ 任务看板
│   ├── components/
│   │   ├── SiteSidebar.astro          # 侧栏导航与移动端抽屉
│   │   ├── RouteTable.astro            # 路由表组件入口
│   │   ├── RouteGroupView.astro       # 分组 / 列表 / 瀑布流视图
│   │   ├── LifeDashboard.astro        # 天气、日历、音乐、GitHub 等模块
│   │   ├── TrackingBoard.astro         # 习惯、工作、番茄钟、长期目标
│   │   ├── SearchBox.astro             # Google / 百度 / Bing 搜索
│   │   └── GithubProfileCard.astro     # GitHub 主页卡片
│   └── data/
│       ├── site.js               # routeCategories 路由数据
│       ├── tracker-config.js     # 追踪目标的唯一配置源
│       ├── todo-data.ts          # 活跃任务看板数据
│       └── archived-todo-data.ts  # 已完成任务归档
├── public/
│   ├── CNAME                    # me.thebear617.cn
│   ├── css/style.css            # 全站样式
│   ├── css/todo-board.css        # 任务看板样式
│   ├── data/tracker-snapshot.json # 已发布的追踪数据快照
│   └── assets/routes/           # 路由表图标
└── dist/                        # 构建产物，不提交
```

当前仓库还保留少量游戏板块迁移前的历史脚本和运行时资源，例如 `scripts/fetch-lol-*.py`、`scripts/gen-nicknames.py` 和 `public/js/vendor/vue.global.js`；它们不属于当前活动页面，也不参与现有页面路由。

## 路由表

路由数据维护在 [src/data/site.js](src/data/site.js) 的 `routeCategories` 中。每条链接通常包含：

- `name`：显示名称；
- `desc`：描述；
- `url` 或 `path`：外部链接或本地路径；
- `tags`：筛选标签；
- `addedAt`：添加日期，格式为 `YYYY-MM-DD`；
- `icon`：可选的本地图标。

[RouteGroupView.astro](src/components/RouteGroupView.astro) 提供：

- 分组视图：每组默认显示最多 6 条，可展开全部；
- 列表视图：按添加时间正序 / 倒序排列；
- 瀑布流视图；
- 链接名称、描述、分类和标签搜索；
- `⌘ K` / `Ctrl K` 聚焦搜索框；
- 分类和标签筛选；
- 手机端自动避免使用横向列表视图。

## 生活仪表盘

[LifeDashboard.astro](src/components/LifeDashboard.astro) 当前包含：

- 西安、南宁、威海天气；
- 点击城市天气卡片查看未来 5 天的天气、温度、降雨概率和最大风速；
- 随时间变化的渐变天空；
- 可翻月日历；
- GitHub 主页及常用仓库；
- 网易云歌单：桌面端嵌入播放器，手机端跳转网易云歌单页面；
- 内嵌追踪看板。

即时天气、渐变天空和日历使用外部 widget iframe；5 日预报通过 Open-Meteo API 按城市坐标请求，并在当前页面缓存 15 分钟；歌单和封面数据直接维护在 `LifeDashboard.astro`。

## 任务看板

任务看板位于 `/todo-board/`，独立于生活仪表盘，包含汇总、编程、科研和生活四个视图，以及待办、进行中、已完成、历史归档和年度完成热力图。任务清单唯一来源是 `src/data/todo-data.ts`，状态真源是 `src/data/todo-state.json`（status、计划区间、阶段的字段级补丁），完成任务后移入 `src/data/archived-todo-data.ts`。本地 dev 下可直接在看板点「➕ 新增任务」弹窗创建任务、点卡片「删除」移除任务——两个操作都由 dev server 直接写回 `todo-data.ts`（`/__todo_file` 端点）；线上只读。

## 追踪数据同步

[TrackingBoard.astro](src/components/TrackingBoard.astro) 的实时数据保存在浏览器 `localStorage`，键名为 `bear-home-tracker-v1`。看板包含：

- 习惯：饮水、咖啡 / 茶、运动、阅读；
- 工作计时和工作次数；
- 番茄钟、休息计时和茶计时；
- Side Project 计时；
- 周视图、月视图和长期目标视图；
- 长期金钱目标。

需要发布本地数据时：

1. 在 `localhost` 启动站点；
2. 打开生活仪表盘，点击追踪看板右上角的同步按钮；同步前会按 `tracker-config.js` 规范化已知目标，自动修正旧 localStorage 中的目标金额；
3. Astro 开发服务器的 `/__tracker_sync` 接口会校验并按日期合并写入 `public/data/tracker-snapshot.json`；缺失的旧日期不会被本地状态覆盖，同一天才由最新本地记录更新；
4. 检查快照后提交并推送。

快照至少包含 `schemaVersion`、`snapshotAt`、`startedOn`、`dailyRecords` 和 `longTerm`。正式站点的周视图、月视图和长期目标视图读取已发布的快照；本地开发时优先使用当前浏览器的本地状态，并在本地记录缺少历史日期时只补齐快照中的缺失日期，不覆盖已有本地记录。

每日记录按 `Asia/Shanghai` 的日期键保存。新的一天只会创建一条全新的空记录（习惯、工作计时、次数和番茄钟从 0 开始），旧日期仍保留给周视图和月视图使用。页面打开期间跨过午夜，或页面从后台重新回到前台时，会先保存当前记录，再自动切换到新日期。快照同步仍然是手动操作，不会因为日期切换自动改写发布文件。

### 本地测试数据链路

本地开发时可以用查询参数模拟日期和正式站的快照分支。先运行 `npm run dev`，再使用一个尚未写入过的测试日期：

```text
/dashboard/?tracker-date=2030-01-01
```

这个地址会为 `2030-01-01` 创建一条全 0 的本地记录。修改第一个视图后点击同步按钮，再把日期改成 `2030-01-02`，可以确认新日期从 0 开始、旧日期仍在历史视图中。使用下面的地址可以让本地周视图、月视图和长期目标视图强制读取快照：

```text
/dashboard/?tracker-source=snapshot
```

`tracker-date` 和 `tracker-source=snapshot` 只在 `localhost` / `127.0.0.1` 生效，不会改变正式站行为；快照分支测试时，第一个当前看板仍然保持本地可编辑状态。

首次使用仓库时启用 Git hook：

```bash
npm run install-hooks
```

`.githooks/pre-push` 会阻止以下情况推送：

- 快照文件不存在或尚未被 Git 跟踪；
- 快照 JSON 结构无效；
- 快照中已知目标的 `target` 与 `src/data/tracker-config.js` 不一致；
- 快照存在未提交的修改。

Hook 只校验文件，不会读取或修改浏览器中的 `localStorage`。

### 修改长期目标

长期目标配置以 `src/data/tracker-config.js` 为准。修改已知目标的 `target` 时，运行一次迁移脚本：

```bash
npm run tracker:migrate
npm run tracker:validate
```

迁移只更新已知目标的配置字段，会保留快照中的当前金额、状态、开始时间和完成时间。`tracker:validate` 同时由本地 `pre-push` hook 和 GitHub Actions 执行，防止旧快照漏更新。

## 本地运行

```bash
npm install
npm run dev
```

开发服务器固定使用 `4321` 端口。需要检查生产构建时运行：

```bash
npm run build
```

## 部署

推送 `main` 后，GitHub Actions 会执行：

1. Node.js 22 + `npm ci`；
2. `npm run tracker:validate`；
3. `npm run build`；
4. 上传 `dist/`；
5. 部署到 GitHub Pages。

常规发布流程：

```bash
git diff --check
git add <变更文件>
git commit -m "feat: 描述变更"
git push origin main
```

## 已迁出的功能

以下功能已经不属于当前 personal 站点：

- 每日日历追踪和支出记录：已迁移至 home；
- 个人开发时间线：已迁移至 DevNotes；
- 会员订阅：已迁移至 home 的 `/membership/`；
- 游戏相关页面和数据：已从当前 personal 页面路由与构建范围移除。

因此，后续维护应以当前 `src/pages/`、`src/components/`、`src/data/site.js` 和 `public/` 为准，不要根据历史游戏板块文件名推断现有页面结构。

## 新机器初始化

```bash
git clone https://github.com/thebear617/bear-home.git
cd bear-home
npm install
npm run install-hooks
```

## 添加内容

- **路由表**：修改 `src/data/site.js` 的 `routeCategories`，新增条目的 `addedAt` 使用添加当天日期。
- **生活仪表盘**：修改 `src/components/LifeDashboard.astro`；外部 widget、歌单和 GitHub 卡片均在组件中维护。
- **追踪看板**：修改 `src/components/TrackingBoard.astro`；发布数据遵循上面的快照同步流程。
- **任务看板**：修改 `src/data/todo-data.ts`；推进状态 / 排期 / 划阶段在本地 dev 看板上操作（写回 `src/data/todo-state.json`），或直接编辑该文件；新增 / 删除任务也可以用看板的「➕ 新增任务」按钮和卡片「删除」按钮（dev 下直接写回 `todo-data.ts`）；完成任务移入 `src/data/archived-todo-data.ts`。
- **长期目标**：修改 `src/data/tracker-config.js`，然后运行 `npm run tracker:migrate` 和 `npm run tracker:validate`。
- **全站样式**：修改 `public/css/style.css`。
- **版本记录**：变更说明写入 `CHANGELOG.md`，但不要把历史游戏板块重新写回当前目录结构。
