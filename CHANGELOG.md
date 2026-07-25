# 熊窝 personal 更新日志

## v0.14.0 — 2026-07-25
refactor: 每日看板迁移至猪窝 home 站

- refactor: 移除每日看板 Tab、TodoBoard 组件与 todo-data 数据层
- refactor: 看板功能迁移至 home 站「每日看板」页面，使用 Astro + 原生 JS 重写
- chore: 删除 js/components/TodoBoard.js、js/todo-data.js

## v0.13.0 — 2026-07-21
refactor: 个人开发时间线迁移至 DevNotes，并完善每日看板

- chore: 删除 `.opencode/skills/bear-sync/`，对应工作流（任务/支出 → Obsidian 日记同步）已于 v0.8.0 随日记与支出记录一起迁移至 home 站
- refactor: 删除「个人开发时间线」Tab、Vue 组件、旧数据与样式，功能迁移至 DevNotes「开发时间线」
- refactor: 时间线同步脚本和 hook 模板迁移至 `devnotes/scripts/`

## v0.12.1 — 2026-07-19
fix: 修复未完成待办跨日后消失

- fix: 待办列改为显示 `date <= 今天` 的 `todo`，昨天未完成的任务继续保留
- feat: 跨日待办显示「跨天待办」提示，未来日期任务仍不会提前出现
- docs: 同步每日看板的跨日规则与组件缓存版本

## v0.12.0 — 2026-07-18
feat: 新增英雄联盟攻略与每日看板两大板块

- feat: 「英雄联盟」汇总法师公式 3.0、ADC 公式 4.0、AP 刺客 3.0 三套攻略视图
- feat: 装备与英雄图片全部本地化，攻略数据独立维护且支持桌面、手机响应式布局
- feat: 「每日看板」提供视频、科研、编程、生活四类任务及待办、进行中、已完成三列视图
- feat: 看板支持当天任务、跨天进行中任务与按分类、日期归档的已完成历史
- fix: 补齐 TodoBoard 组件加载，并修正带参数状态过滤器导致的空白页
- docs: 同步站点架构、内容维护方式与版本说明

## v0.11.0 — 2026-07-18
feat: 英雄联盟新增 AP 刺客 3.0 视图

- feat: 攻略切换扩展为「法师公式 3.0 / ADC 公式 4.0 / AP 刺客 3.0」三个标签
- feat: 根据 `BV1snTk65EPf` 转写与画面校对，录入带咒刃统一公式和六名不带咒刃英雄的独立公式
- feat: 快速规则补充守护者法球、术士果汁盒换法穿鞋、自购重伤球和团战切入原则
- feat: 新增 AP 刺客装备与英雄本地图标，页面继续保持零 CDN 依赖
- style: 不带咒刃采用双栏英雄查表卡片，手机端收为单栏

## v0.10.0 — 2026-07-18
feat: 英雄联盟新增 ADC 公式 4.0 双视图

- feat: 英雄联盟板块顶部新增「法师公式 3.0 / ADC 公式 4.0」分段标签
- feat: 根据 `BV1A8j46xEsV` 转录与画面校对，录入两件套公式、11 级海克斯分支、界弓特例和后续按需装备
- feat: 新增 ADC 装备与英雄本地图标，继续保持页面零 CDN 依赖
- style: ADC 使用红橙色流程卡片；桌面三栏、手机单栏响应式布局
- fix: ADC 手机标题固定为两行，避免窄屏随机断字

## v0.9.0 — 2026-07-18
feat: 新增「英雄联盟」出装公式板块

- feat: 侧边栏新增「英雄联盟」Tab，采用独立深蓝黑攻略主题
- feat: 录入双烧流、爆炸流、开团流、快速规则与瑞兹特例
- feat: 新增 `js/lol-data.js` 数据文件，攻略内容与渲染组件分离
- feat: 装备图标与英雄头像全部保存到 `assets/lol/`，不依赖 CDN
- style: 适配桌面与手机布局，手机端图标自动换行且无横向溢出

## v0.8.1 — 2026-07-13
feat: 路由表新增「常用链接」分类，会员订阅补充 ChatGPT Plus，修复备注列截断

- feat: 路由表 `routeCategories` 新增「🔗 常用链接」分类（LDXP 神秘小铺 / OpenTheRank / OpenRouter Rankings），置于「个人站点」之后
- feat: 会员订阅 `membershipRecords` 新增 ChatGPT Plus（到期 2026-08-12，¥25/月，备注登录账号）
- fix: 会员表 `.mt-note` 改为换行显示，备注不再被单行省略号截断

## v0.8.0 — 2026-07-11
refactor: 移除「日历」「记账」两个 Tab 及构建管线（大版本）

- refactor: 删除 CalendarView / ExpenseView 组件及注册
- refactor: 删除 calendar / expense 两个 Tab、expenseCategories / manualRecords / recordLabel / dailyRecords
- chore: 删除 js/diary-data.js、js/expense-data.js、scripts/* 构建管线与 pre-commit hook
- docs: README 同步说明每日追踪与支出记录已迁移至 home
- 注：home 新增「每日追踪」「支出记录」两个 Tab 承接全部功能（见 home v0.9.0）
