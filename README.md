# 熊窝 · 个人主页

线上：`https://me.thebear617.cn/`（GitHub Pages 仓库 `thebear617/bear-home`，自定义域名）

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | **Astro**（静态构建） + Vue 3（目前仅无畏契约页面保留运行时） |
| 样式 | 暖色调设计 token（米黄 `#f7f3ee` + 深棕 `#2f2924` 侧栏），同 home/、cats/ |
| 构建 | Astro 输出 `dist/`，GitHub Pages 部署构建产物 |

## 架构

```
personal/
├── astro.config.mjs            # Astro 静态构建配置
├── package.json                # 构建脚本与依赖
├── .githooks/pre-push          # 推送前校验追踪快照（见下「追踪数据同步」）
├── scripts/install-hooks.sh    # 把 core.hooksPath 指向 .githooks
├── src/
│   ├── layouts/SiteLayout.astro        # 通用布局（侧栏 + 主区）
│   ├── pages/
│   │   ├── index.astro                 # 🏠 生活仪表盘
│   │   ├── routes/index.astro          # 🗺️ 路由表
│   │   ├── valorant/index.astro        # 🎯 无畏契约
│   │   └── lol/index.astro             # ⚔️ 英雄联盟
│   ├── components/
│   │   ├── SiteSidebar.astro           # 侧栏（4 个 Tab 入口）
│   │   ├── LifeDashboard.astro         # 生活仪表盘（搜索/天气/日历/番茄钟/GitHub 卡片）
│   │   ├── TrackingBoard.astro         # 追踪看板（习惯/工作/番茄/长期目标，仪表盘内嵌）
│   │   ├── RouteTable.astro            # 路由表（列表视图）
│   │   ├── RouteGroupView.astro        # 路由表（分组 / 瀑布流视图）
│   │   ├── SearchBox.astro             # 多引擎搜索
│   │   ├── GithubProfileCard.astro     # GitHub 主页卡片
│   │   ├── LolView.astro               # 英雄联盟（英雄速查画廊 + 公式详情双视图）
│   │   └── lol/{MageGuide,AdcGuide,AssassinGuide,ItemPicks,HeroDrawer}.astro
│   └── data/
│       ├── site.js                     # routeCategories 路由表数据
│       ├── lol.js                      # 英雄联盟公式详情（手工教学数据）
│       ├── lol-heroes.js               # 全英雄索引（脚本生成，RESG 驱动）
│       ├── lol-augments.js             # 海克斯推荐（脚本生成，RESG 驱动）
│       └── lol-nicknames.js            # 外号 + 拼音（脚本生成）
├── public/
│   ├── css/style.css
│   ├── js/vendor/                      # 无畏契约过渡页用的 Vue / marked 运行时
│   ├── data/tracker-snapshot.json      # 追踪看板发布的快照
│   ├── valorant/                       # 无畏契约数据与交互脚本
│   └── assets/
└── dist/                               # Astro 构建产物（不提交）
```

> 注：原「每日日历追踪 / 支出记录」Tab（Obsidian 日记 → `diary-data.js` / `expense-data.js` 的自动编译链路）已于 2026-07-11 迁移至 home 站点（`js/expense-data.js` + `js/diary-data.js` + 「每日追踪」Tab），personal 侧相关文件与组件已移除。

> 原「个人开发时间线」已迁移至 DevNotes 的「开发时间线」，personal 侧旧 Tab、数据和同步脚本均已移除。时间线 hook 与同步工具由 `devnotes/scripts/` 统一维护。

> 原「会员订阅」Tab 已迁移至 home 站 `/membership/` 页面，personal 侧组件与数据已移除。

## 本地运行

```bash
npm install
npm run dev
# 打开 Astro 输出的本地地址
```

## 追踪数据同步

追踪看板（`TrackingBoard.astro`，内嵌在生活仪表盘）的数据实时保存在浏览器 localStorage。需要把本地数据发布到正式域名时，在 localhost 看板右上角点击同步按钮；如果数据有变化，会更新 `public/data/tracker-snapshot.json`。随后提交并推送这个文件，周视图、月视图和专注视图就会使用最近一次发布的快照。

首次使用时执行一次，把 Git hooks 指向仓库内的 `.githooks/`：

```bash
npm run install-hooks
```

`.githooks/pre-push` 会在 `git push` 时校验 `tracker-snapshot.json`：
- 文件存在且已 `git add` 进版本库；
- 结构有效（含 `schemaVersion` / `snapshotAt` / `startedOn` / `dailyRecords`）；
- 已提交（工作区与 HEAD 无差异）。

任一项不通过都会阻止推送。Hook 不会读取或修改浏览器数据。

## 部署

```bash
git add . && git commit -m "chore: 更新" && git push origin main
```

推送后由 GitHub Pages 发布 `dist/` 构建产物（仓库已配置 Astro 构建动作）。

## 新机器初始化

```bash
git clone https://github.com/thebear617/bear-home.git
cd bear-home
npm install
npm run install-hooks   # 一次性，启用 pre-push 校验
```

## 英雄联盟数据更新

> 英雄联盟板块（`/lol/`）的英雄速查数据来自 **RESG**（`https://www.resg.top/`）的公开 API，是**静态数据快照**，需要定期手动刷新。RESG API 基址 `https://api.resg.top`，CORS 开放，服务端可直连。

**数据文件**（均在 `src/data/`，由脚本自动生成，勿手改）：

| 文件 | 内容 | 生成脚本 |
|------|------|---------|
| `lol-heroes.js` | 全 173 英雄索引（中文名 / 定位 role / 头像 / 胜率 / 热度） | `fetch-lol-all.py` |
| `lol-augments.js` | 每英雄海克斯推荐（单/双/三/四 Top5 + 胜率 + 出装） | `fetch-lol-all.py` |
| `lol-nicknames.js` | 英雄外号表 + 拼音（搜索用） | `gen-nicknames.py` |
| `lol.js` | 手工维护的公式详情视图数据（法师/ADC/刺客教学） | 手改 |

> 注：`lol-heroes.js` / `lol-augments.js` / `lol-nicknames.js` 是**由脚本生成的产物**，修改需通过脚本重新生成，不要直接手改。`lol.js` 是手工维护的公式教学数据，可手改。

**手动更新流程**（游戏新版本数据变化，或想刷新海克斯胜率时）：

```bash
cd personal

# 1. （可选）如果游戏已更新大版本，先改脚本里的版本号：
#    在 scripts/fetch-lol-all.py 顶部把 VERSION 改成 RESG 当前版本（默认 16.14）

# 2. 重新拉取全部英雄数据（头像已存在会自动跳过）
python3 scripts/fetch-lol-all.py

# 3. 重新生成外号 + 拼音（基于最新英雄名）
python3 scripts/gen-nicknames.py

# 4. 构建
npm run build

# 5. 提交并推送（GitHub Actions 自动部署 dist/）
git add src/data && git commit -m "feat(lol): 更新英雄数据" && git push origin main
```

**脚本可选参数**：

- `fetch-lol-all.py --no-heads`：跳过重新下载头像（默认会自动补下载缺失头像）
- `fetch-lol-all.py --heros brand,kassadin`：只更新指定英雄（调试用）
- 手动改外号请编辑 `scripts/gen-nicknames.py` 里的 `NICK` 字典，再重跑第 3 步

**常用数据源**：

- 英雄列表 / 定位 / 头像：`https://www.resg.top/c/zh_cn/v1/champion-summary.json`
- 海克斯组合胜率：`/api/synergy?championId={id}&version={V}&top=15`
- 英雄总体胜率 / 热度：`/api/champions/stats?version={V}`
- 海克斯 / 装备名称：`/api/augments`、`/api/items`

## 添加内容

- **路由表**：在 `src/data/site.js` 的 `routeCategories` 中添加条目，`addedAt` 一律使用添加当天的日期（格式 `YYYY-MM-DD`）。
- **英雄联盟**：页面入口 `/lol/`，由 `src/components/LolView.astro`（英雄速查，RESG 数据驱动）与 `lol/` 下三个公式组件（公式详情，手工数据 `lol.js`）渲染。全英雄数据更新见上「英雄联盟数据更新」。
- **无畏契约**：页面入口 `/valorant/`，数据与交互脚本位于 `public/valorant/`，运行时依赖 `public/js/vendor/` 下的 Vue / marked。
- **追踪看板**：习惯 / 工作 / 番茄 / 长期目标等数据在浏览器 localStorage 维护，发布流程见上「追踪数据同步」。
