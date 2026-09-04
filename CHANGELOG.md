# 熊窝 personal 更新日志

## v0.30.2 — 2026-09-04

feat(todo-board): 甘特图新增「按小时」视图，任务排期支持整点时间端点

- feat: 甘特图工具栏新增「按天 / 按小时」切换；按小时视图把计划区间按整点小时铺成行序，适合 1–2 天内的小任务
- feat: 任务排期新增可选 `plannedStartTime` / `plannedEndTime` 整点字段，两端同时存在时任务进入「按小时」视图；阶段弹窗支持填写起止整点时刻
- feat: 小时任务阶段按连续整点归一化，后一阶段从前一阶段结束时刻立即开始，末阶段自动收在结束时刻；按小时拖动整条/分割缝边界保持整点对齐
- feat: `POST /__todo_sync` 落盘前按小时语义归一化阶段（排序、连续铺满、闭合末段），与前端渲染同一套逻辑
- feat: `todo:validate` 与 GitHub Actions 校验整点排期——`HH:00` 格式、起止时刻须成对、结束须晚于开始、小时任务阶段时间端点合法
- feat: 甘特条按小时视图显示各阶段起止时刻，阶段色带按整点切片；看板卡片阶段缩略条保留
- chore: todo-data.ts 的 `TodoItem` 接口与 todo-state.json 支持小时排期字段；同步 l8（带赫兹去博辰复诊，整点排期）、r5（阶段补充）等任务数据

## v0.30.0 — 2026-09-01

feat(todo-board): 看板视图支持「新增任务」弹窗，直接写回 todo-data.ts

- feat: 看板 header 新增「➕ 新增任务」按钮（仅本地 dev 可编辑），弹窗填写看板分类、名称、链接、备注、目标日期五项；新建任务一律先进待办，排期走卡片上的「开始排期」；看板分类为自定义样式的下拉（替代原生 select 系统弹出）
- feat: 新增端点 `POST /__todo_file`：add 往 `src/data/todo-data.ts` 对应看板的 items 数组头部插入一行（id 按看板前缀 l/c/r 取现有最大值递增），remove 按 id 整行移除；字符串统一 JSON.stringify 序列化，引号 / 换行不破坏单行格式；写盘复用 self-write 抑制窗口，客户端同步内存看板数据保持 UI 一致
- feat: 卡片「删除」按钮对全部非归档任务开放（confirm 确认），与弹窗新增走同一条 todo-data.ts 写回链路——任务清单从此只有 todo-data.ts 一个来源
- chore: 上一版 customItems 方案整体退役（`/__todo_sync` 协议字段、渲染合并路径、`todo:validate` 校验全部移除），已有自定义条目手动迁移进 todo-data.ts
- fix: 新任务 id 生成只扫活跃文件，会撞上归档文件里同前缀的更大编号（验收时 l33 与归档 l33 撞号，状态补丁互相污染、弹窗标题张冠李戴）——改为扫活跃 + 归档两个文件取全局最大值递增，冲突条目已改号 l39

## v0.29.0 — 2026-09-01

feat(todo-board): 本地编辑不丢视图 + 分割缝拖拽修复 + 工具栏精简

- fix: 拖拽阶段分割缝时右阶段预览错位重叠——列号原来相对左阶段起点计算，只有第一道缝碰巧正确；改为统一以任务条起点为参照（`leftStartColumn`），并为阶段格子加 `grid-row: 1` 兜底，任何预览值都不会把阶段挤到第二行
- feat: 借鉴 lifenotes/devnotes 本地 CMS 的做法，`astro.config.mjs` 中 todo-sync / tracker-sync 自写盘后 2.5s 内吞掉 dev server 的 `full-reload` / `update` 广播——本地编辑甘特图不再整页刷新、视图不再被重置回看板
- chore: 移除甘特图「划分阶段」按钮的阶段列表悬浮窗与「定位今天」按钮；工具栏改为副标题左对齐、「显示已完成」与计划区间在右侧对齐成一列

feat(todo-board): 甘特条支持阶段划分，长任务拆成有名字的连续子区间

- feat: 任务补丁新增 `phases[]`（id/title/start/end/status），阶段连续无缝铺满计划区间，首阶段对齐 plannedStart、末阶段收在 plannedEnd
- feat: 甘特条从实体色块改为阶段轨道容器，每段独立着色（未开始灰 / 进行中橙 / 完成绿）；≥3 天的阶段显示名称，更短的只留颜色与悬浮提示
- feat: 甘特行新增「分阶段 / 阶段 N」入口，弹窗按「切割点」编辑（每行只填结束日期，下一段自动从次日开始），支持添加、删除、平均分配、清除
- feat: 拖拽整条时阶段整体平移；拖拽两端时只动首/末阶段边界；移出甘特图时清除阶段
- feat: 看板卡片新增阶段缩略条，按天数比例着色并显示当前阶段名
- chore: 阶段编辑用草稿数组驱动，避免 refresh() 重建 DOM 时丢失用户输入
- chore: `/__todo_sync` 支持 phases 字段，落盘前统一归一化（排序、消除空档、末阶段闭合、天数不足时截断多余阶段）
- chore: `todo:validate` 增加阶段校验——id/名称/日期格式、start ≤ end、阶段间不得留空档、末阶段必须收在 plannedEnd
- chore: 拖拽手柄改为绝对定位，不再占用布局流，保证阶段列宽与日期轴严格对齐

feat(todo-board): 任务看板状态去 localStorage 化，真源迁入仓库随发布构建同步

- feat: 新增 `src/data/todo-state.json` 作为任务状态唯一真源（status / plannedStart / plannedEnd / completedAt 字段级补丁，结构与原 localStorage 补丁一致）
- feat: `astro.config.mjs` 新增 `todoSyncPlugin`，本地 dev 下看板操作通过 `POST /__todo_sync` 合并写回仓库状态文件（按任务 id 整体替换，空补丁即清除）
- feat: 构建时状态文件经 `define:vars` 注入页面并内联进静态产物，线上零额外请求；`git push` 后 CI 校验通过即发布，全设备一致
- feat: 线上看板转为只读：不渲染编辑按钮、禁用甘特条拖拽，header 显示「🔒 线上只读」徽标；本地 dev 全功能可编辑，写盘成功才算修改成功
- fix: 归档任务不再可能被本地残留补丁污染状态（原 localStorage 补丁覆盖归档状态的根因消除）
- chore: 新增 `npm run todo:validate` 校验脚本；pre-push hook 与 GitHub Actions 均加入任务状态校验，未提交的状态文件将阻断推送/发布
- chore: 本地 dev 首次打开看板时自动把旧 localStorage（`bear-home.todo-board.v1`）补丁迁移进仓库并清除旧 key

## v0.25.0 — 2026-08-08

feat(routes): 路由表「娱乐」分组更名为「购物娱乐」，新增京东商城入口

- feat: `entertainment` 分组 `title` 由「娱乐」改为「购物娱乐」，`id` 保持不变，分组图标改为 🛍️
- feat: 分组内 Bilibili 之后新增「京东」条目（`https://www.jd.com/`），tags 为 购物/电商
- feat: 新增京东本地图标 `public/assets/routes/京东.png`（favicon 来源，已归一化为 256×256 PNG）
- chore: Astro 从 5.x 升级至 7.2.0，并同步更新 npm 锁文件
- chore: 保持纯静态页面构建，不引入内容集合迁移

## v0.24.1 — 2026-08-05

feat(routes): 路由表图标全面本地化，移除 Google favicon API 依赖

- feat: 为路由表 16 个 URL 条目新增本地图标，统一存于 `public/assets/routes/`（256×256 PNG）
- feat: 图标内容做透明边裁剪并铺满画布，避免不同站点 favicon 显示尺寸不一致
- fix: 移除路由卡片/列表/瀑布流对 `www.google.com/s2/favicons` 的运行时依赖，国内访问不再破图
- fix: 无图标条目回退显示分类 emoji，而非外部 API
- chore: 新增 `scripts/download-route-icons.py` 与 `normalize-route-icons.py` 维护脚本
- chore: 「猫猫」站点域名更新为 `cat.xdubear.cn`

## v0.23.1 — 2026-08-02

fix: 天气预报弹窗与追踪快照一致性

- feat: 点击西安、南宁或威海天气卡片查看未来 5 天预报
- feat: 新增温度、天气类型、降雨概率和最大风速展示，并适配移动端弹窗
- fix: 修复正式站读取追踪快照的路径问题
- fix: 集中维护长期目标配置，自动迁移旧 localStorage / 快照中的目标金额
- chore: 增加追踪快照迁移脚本、推送前校验和 GitHub Actions 校验

## v0.21.3 — 2026-08-02

feat(lol): 英雄速查搜索支持英雄称号匹配

- feat: 英雄数据新增称号字段（如安妮 → 黑暗之女），搜索框输入称号也能定位英雄
- feat: 搜索同时匹配 英雄名 / 称号 / 英文id / 外号 / 拼音
- feat: 英雄详情抽屉头部显示称号
- chore: fetch-lol-all.py 生成数据时保留称号字段

## v0.21.2 — 2026-08-02

fix(routes): 优化路由表移动端的信息密度与视图选择

- fix: 分组卡片在移动端保持双列，缩小卡片、工具栏与瀑布流的留白
- fix: 移动端隐藏横向表格列表视图，并在缩窄窗口时自动回到分组视图

## v0.21.1 — 2026-08-01

fix: 补全 v0.21.0 遗漏的 34 个英雄小写头像（macOS 大小写不敏感文件系统下通配符 add 未命中）

## v0.21.0 — 2026-08-01

feat: 英雄联盟板块重构为 RESG 全英雄数据驱动的英雄速查，新增外号/拼音搜索与筛选排序

- feat: 英雄速查升级为全部 173 位英雄，数据来自 RESG（海克斯大乱斗数据站）公开 API 的静态快照；新增英雄索引、海克斯推荐、外号表三个数据文件与两个生成脚本
- feat: 新增英雄详情抽屉，展示每英雄 RESG 实战海克斯推荐（单/双/三/四 Top5 + 胜率 + 对应出装）
- feat: 英雄画廊支持官方定位筛选（战士/坦克/法师/刺客/辅助/射手）、外号/拼音搜索、默认/胜率/热度排序
- feat: 搜索框放工具栏左侧，筛选与排序收进下拉浮窗，交互更简洁
- feat: 新增生成脚本 `fetch-lol-all.py`（拉英雄/海克斯/头像/胜率）与 `gen-nicknames.py`（外号+拼音）
- style: 英雄卡片紧凑化、按定位配色；全英雄头像本地化（RESG 源，173 张）
- fix: 公式详情视图英雄头像 404（数据路径大小写统一为 RESG 小写）
- fix: 无畏契约页「返回熊窝」链接由 `../` 改为 `../index.html`，修复子路径下返回 404
- docs: README 新增「英雄联盟数据更新」章节与脚本说明

## v0.20.1 — 2026-07-31

feat: 更新首页路由表

- 替换路由表图标
- 替换首页

## v0.17.0 — 2026-07-29

refactor: 会员订阅迁移至猪窝 home

- refactor: 删除「会员订阅」侧栏入口、页面组件与数据源
- docs: 移除熊窝的会员订阅维护说明
- note: 会员订阅现由猪窝 `/membership/` 页面统一承接

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
