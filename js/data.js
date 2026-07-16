const routeCategories = [
  {
    title: '🏠 个人站点',
    items: [
      { name: '猪窝', desc: '家居生活管理与美食记录', url: 'https://pig.thebear617.cn/' },
      { name: '猫猫', desc: '猫协档案与疫苗绝育追踪', url: 'https://cat.thebear617.cn/' },
      { name: '熊窝（个人主页）', desc: '个人主页、日历追踪与支出记录', url: 'https://me.thebear617.cn/' },
      { name: '科研笔记', desc: '个人科研笔记总站', url: 'http://rea.thebear617.cn/' },
      { name: '开发笔记', desc: '个人开发知识库', url: 'https://dev.thebear617.cn/' },
      { name: '常识笔记', desc: '个人多领域常识知识站', url: 'https://life.thebear617.cn/' },
      { name: '租房对账表', desc: '租房看房清单', url: 'http://rent.thebear617.cn/' },
    ]
  },
  {
    title: '🔗 常用链接',
    items: [
      { name: 'LDXP 神秘小铺', desc: '买 ChatGPT / Claude 订阅，比官方便宜', url: 'https://pay.ldxp.cn/shop/T37M9N2N/' },
      { name: 'Hero SMS 接码平台', desc: '接码平台，ChatGPT 电话验证登录时收验证码用', url: 'https://hero-sms.com/cn' },
      { name: 'OpenTheRank', desc: '查全球各家大模型官方订阅在各地区的价格', url: 'https://opentherank.com/zh/' },
      { name: 'OpenRouter Rankings', desc: '看全球所有大模型的实时用量 + 实时性能排行', url: 'https://openrouter.ai/rankings' },
      { name: '鲜枣课堂', desc: '大量优质领域科普 PPT，可直接在线浏览', url: 'http://www.xzclass.com/?page_id=2390' },
      { name: 'JavaGuide', desc: 'GitHub 156K+ Star 的 Java 面试与后端知识体系：计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发', url: 'https://javaguide.cn/' },
    ]
  },
  {
    title: '📂 本地文件',
    items: [
      { name: 'htmls', desc: '所有个人站点源码合集', path: '~/Documents/htmls' },
      { name: 'Obsidian Vault', desc: '知识库与笔记', path: '~/Documents/notes' },
    ]
  }
];

// 个人开发时间线 — 记录自己做过的开发项目 / 站点 / 工具
// 字段：id, title, date, tags, body（Markdown）
const cookbookEntries = [
  {
    id: 'home-v010',
    title: '猪窝 v0.1.0：项目上线',
    date: '2026-06-26',
    tags: ['猪窝', '站点'],
    body: `第一个个人站点。用纯 HTML + CSS + 原生 JS 搭建的家庭管理工具，记录厨房物资采购清单、电费余额追踪。

## 技术选型
- 纯静态，无框架，GitHub Pages 部署
- 数据驱动：JS 数据文件 + 手写渲染逻辑`,
  },
  {
    id: 'reanotes-v010',
    title: '科研笔记 v0.1.0：表征学习理解图谱上线',
    date: '2026-06-30',
    tags: ['科研笔记', '站点'],
    body: `第一个科研笔记站点。用 JS 对象描述知识图谱节点与边，渲染引擎生成交互页面。

## 关键决策
- 零依赖：不引入任何框架，纯手写渲染逻辑
- 数据驱动架构：数据文件 + 渲染引擎，后续所有站点的技术范式由此确立`,
  },
  {
    id: 'home-v020',
    title: '猪窝 v0.2.0：新增美食记录 Tab',
    date: '2026-06-30',
    tags: ['猪窝', '功能'],
    body: `猪窝从单纯的物资管理扩展到美食记录。新增 Tab 记录每日做饭菜品与花费，开始向「家庭生活全记录」演变。`,
  },
  {
    id: 'cats-v010',
    title: '猫猫 v0.1.0：猫猫手册上线',
    date: '2026-07-01',
    tags: ['猫猫', '站点'],
    body: `猫协档案管理站点。包含猫咪档案、疫苗/绝育追踪、搜索筛选，服务西电猫协日常运营。

## 技术特点
- 与其他站点共享暖色调设计 token（米黄 #f7f3ee + 深棕 #2f2924）
- 图片全部本地托管，不依赖 CDN`,
  },
  {
    id: 'personal-v010',
    title: '熊窝 v0.1.0：上线，第一个 Vue 3 站点',
    date: '2026-07-05',
    tags: ['熊窝', '站点'],
    body: `个人主页上线。首次引入 Vue 3（自托管，不依赖 CDN），采用 SPA 单页架构：左侧 sidebar 切换功能 Tab。

## 架构突破
- 从此前的纯手写 DOM → Vue 响应式渲染
- 组件化：每个 Tab 独立组件，数据通过 props 注入
- 路由表、日历追踪、支出记录、Cookbook 四个 Tab 同期上线`,
  },
  {
    id: 'cats-v020',
    title: '猫猫 v0.2.0：重新设计猫卡，新增计划/科普 Tab',
    date: '2026-07-06',
    tags: ['猫猫', '功能'],
    body: `猫猫手册首次大改版。猫卡片从纯文字升级为照片+姓名布局，新增近期计划和科普两个 Tab，站点从单一的「档案查询」扩展为「猫协知识站」。

同时修复了微信内置浏览器 X5 内核的兼容性问题（侧边栏 GPU 加速、-webkit- 前缀等）。`,
  },
  {
    id: 'personal-v030',
    title: '熊窝 v0.3.0：Cookbook 时间轴+详情两页模式',
    date: '2026-07-07',
    tags: ['熊窝', '架构'],
    body: `Cookbook 从简单列表升级为 zigzag 时间轴布局（年/月分组 + 左右交替 + 竖线节点），点击条目进入 Markdown 渲染的详情页。

## 同时沉淀
- 纯静态站点五层渲染模型：Page → Tab → Section → Item → 点击行为
- 三层数据与两层样式完全解耦的设计方法论`,
  },
  {
    id: 'home-v030',
    title: '猪窝 v0.3.0：新增美食地图、出发双 Tab',
    date: '2026-07-08',
    tags: ['猪窝', '功能'],
    body: `猪窝继续扩展生活记录维度。新增「美食地图」Tab（校内外美食点评）和「出发」Tab（旅游记录），从 2 个 Tab 扩展到 4 个。`,
  },
  {
    id: 'home-v040',
    title: '猪窝 v0.4.0：出发拆分为旅游 + 西安 walk 双 Tab',
    date: '2026-07-08',
    tags: ['猪窝', '功能'],
    body: `「出发」Tab 拆分为「旅游🛫」和「西安 walk」两个独立 Tab，两 Tab 共用参数化的时间线渲染（buildTravelTimeline 重构为支持不同数据源）。

## 内容
- 录入 10 条真实旅行记录：大理、长沙、武汉、南京、烟台、威海、大连、成都、天津、天水草原
- 录入 1 条西安出行（小寨原力场），移除示例数据（阿那亚、青岛）
- 修复：同日出行不再显示日期范围、时间线改为纯日期正序、错别字（平常→品尝、出么→出门）
- 默认激活页改为旅游🛫`,
  },
  {
    id: 'home-v050',
    title: '猪窝 v0.5.0：美食地图架构重构',
    date: '2026-07-08',
    tags: ['猪窝', '架构'],
    body: `美食地图从单一列表重构为校内/校外双区域 + 新配色方案。同时「出发」Tab 拆分为「旅游」和「西安 walk」两个独立 Tab。

## 架构演进
- Tab 数量从 4 个扩展到 6 个，逐步形成「家居管理 + 美食记录 + 出行记录」三大板块`,
  },
  {
    id: 'personal-v040',
    title: '熊窝 v0.4.0：无畏契约板块 + Markdown 渲染体系',
    date: '2026-07-08',
    tags: ['熊窝', '渲染'],
    body: `引入 marked.js，用 Markdown 管理 Valorant 战术笔记并前端实时渲染。建立了完整的 Markdown → HTML 渲染标准（表格、代码块、引用、callout），后续常识笔记的 build-notes.py 直接复用这套经验。`,
  },
  {
    id: 'reanotes-v020',
    title: '科研笔记 v0.2.0：升级为多板块科研笔记总站',
    date: '2026-07-09',
    tags: ['科研笔记', '架构'],
    body: `从单一表征学习主题升级为多板块科研笔记总站。新增 BOARDS 索引 + 顶栏切换器 + 两级 hash 路由（#boardId/pageId），支持任意扩展新板块。

## 三大板块
- 表征学习 🧠：知识图谱 + 笔记双视图，新增「理论基底」页（Bengio 表征定义 + 十大先验）
- 深度学习工程 🛠️：八阶段研发流程（问题→数据→架构→训练→调优→部署→复盘→迭代）
- 深度学习科研 🔬：总览 + 五个主战场（问题/架构/表征/训练/调优）+ 科研 vs 工程对照

## 体验修复
- 修复侧边栏叶子/子节点链接点击跳回主页
- 卡片内联排版（ol/ul/li/strong/a/table）与 flow-list 圆圈序号

## 双托管
- Vercel 自定义域名 rea.thebear617.cn（主力）
- GitHub Pages 作源/备用`,
  },
  {
    id: 'reanotes-v030',
    title: '科研笔记 v0.3.0：新增深度学习工程与深度学习科研两个板块',
    date: '2026-07-11',
    tags: ['科研笔记', '功能'],
    body: `在 v0.2.0 多板块架构基础上，新增两个独立板块。

## 深度学习工程 🛠️
- 八阶段研发流程：问题 → 数据 → 架构 → 训练 → 调优 → 部署 → 复盘 → 迭代
- 各阶段独立成页，沉淀工程落地经验

## 深度学习科研 🔬
- 总览 + 五个主战场：问题 / 架构 / 表征 / 训练 / 调优
- 科研 vs 工程对照，厘清两条线的差异`,
  },
  {
    id: 'reanotes-v031',
    title: '科研笔记 v0.3.1：表征学习板块新增「学术会议与期刊」外链宫格',
    date: '2026-07-14',
    tags: ['科研笔记', '功能'],
    body: `表征学习板块（🧠）下新增 venues 页面，收录 17 张顶会/顶刊官方链接卡片。

## 宫格内容
- 顶级会议 11：NeurIPS / ICML / ICLR / CVPR / ICCV / ECCV / ACL / EMNLP / NAACL / AAAI / KDD
- 顶级期刊 4：JMLR / TPAMI / Nature Machine Intelligence / Machine Learning
- 细分方向 2：TheWebConf (WWW, 图) / RLC (强化学习)

## 卡片信息
- 每张卡片紧跟领域标签（CV / NLP / ML·多模态 / 图 / RL / AI，按主题配色）
- 含原贴备注说明（如 ICLR 名字带 Representations、CVPR 为视觉主场等）
- 点开新标签页跳官方页`,
  },
  {
    id: 'lifenotes-v010',
    title: '常识笔记 v0.1.0：站点上线',
    date: '2026-07-09',
    tags: ['常识笔记', '站点'],
    body: `把 Obsidian「知识观察型笔记」编译为多领域常识站。复用科研笔记引擎，品牌色暖橙 #c2410c。

## 编译管线
- build-notes.py 处理 Obsidian 语法（callout、wiki 内链、表格）→ JS 数据文件
- 试点 3 领域（美食/AI/汽车），同日全量迁移至 9 领域
- 仅编译「领域地图 + QA」两页，排除转录/术语表`,
  },
  {
    id: 'devnotes-v010',
    title: '开发笔记 v0.1.0：站点骨架 + 价格矩阵',
    date: '2026-07-09',
    tags: ['开发笔记', '站点'],
    body: `开发知识库上线。Vue 3 自托管（与熊窝共享 Vue），包含「笔记中心」（多维度筛选 + 卡片网格）和「价格矩阵」（20 产品 / 7 赛道 coding plan 价格对比）。

## 价格数据
- 国产产品只取中文站人民币价
- 海外产品保留美元标注「无国区定价」
- 只收录订阅套餐价，不收录 API 裸按量价`,
  },
  {
    id: 'personal-v050',
    title: '熊窝 v0.5.0：新增会员订阅 Tab',
    date: '2026-07-09',
    tags: ['熊窝', '功能'],
    body: `30 条会员订阅记录按标签手风琴分组，含月均消费预览。同日完成支出单源编译改造：Obsidian 日记 #支出 表 → build-diary.py → expense-data.js，不再手改数据。

## 架构意义
- 支出数据实现「记在 Obsidian / 展示在网站」的单源模式
- 与日程编译共用 pre-commit hook 自动构建`,
  },
  {
    id: 'home-v060',
    title: '猪窝 v0.6.0：新增关系时间线 Tab',
    date: '2026-07-09',
    tags: ['猪窝', '功能'],
    body: `猪窝新增第 6 个 Tab。将散落在各处的旅游、西安 walk、吵架复盘等生活记录收编到一个集中的时间线视图。

## 站点全貌
至此已有 6 个 Tab：电费 / 物资 / 美食记录 / 美食地图 / 出发（旅游+西安 walk）/ 关系时间线，覆盖家庭生活的核心维度。`,
  },
  {
    id: 'home-v070',
    title: '猪窝 v0.7.0：做饭心得视图视觉定稿',
    date: '2026-07-10',
    tags: ['猪窝', '架构'],
    body: `做饭心得视图视觉定稿（合并此前 6 次视觉打磨提交）：
- 折叠条按记录位置循环取多彩渐变，相邻互不相同；图标改为白芯片，在彩色条上更醒目
- 配色对齐 cats tab：去除 callout 粗色条与彩虹渐变，改用柔底深字 + 金色激活环
- 每条记录增加分类配色 icon 徽标
- 炒菜分类置顶到导航第一位
- 炒菜分类新增「番茄酸菜肉丝米线」卡片（用量两人一顿 + 五步做法），Markdown 手风琴渲染`,
  },
  {
    id: 'home-v080',
    title: '猪窝 v0.8.0：生活备忘录与物资采购 Tab 改造',
    date: '2026-07-10',
    tags: ['猪窝', '架构'],
    body: `生活备忘录与物资采购 Tab 由清单式重构为仿美食日历的胶囊双视图：📋 生活备忘 / 🛒 物资采购，各视图内按区域手风琴卡片展开。
- 区域卡片正文统一经 renderMarkdown 渲染（与做饭心得卡片同款 cookbook-md 样式）
- 移除「后续待办事项」板块；卫生间采购项删除「按压式洗衣液（网上买）」
- 顶栏 Tab 改名「生活备忘录及物资采购」→「生活备忘录与物资采购」，并调整顺序
- data.js 结构：follow-up 重构为 memo-supplies，数据拆 lifeMemo / procurement
- setupFoodViews 通用化（胶囊切换 + 手风琴展开对美食日历与本 Tab 共用）`,
  },
  {
    id: 'lifenotes-v020',
    title: '常识笔记 v0.2.0：领域地图两视图 + 笔记中心式首页',
    date: '2026-07-10',
    tags: ['常识笔记', '架构'],
    body: `常识笔记首次内容形态升级。每个领域的「领域地图」页内支持分类视图 / 时间轴视图切换，首页直接展示 records 而非薄卡片。删掉整个侧边栏（每领域只一个页面，侧栏冗余）。

## 核心设计
- parse_map_records 把 callout + H2/H3 文本块解析为 records（带日期/分类）
- 与开发笔记「笔记中心」设计语言对齐：分类/时间轴双视角 + 记录点击展开`,
  },
  {
    id: 'cats-v030',
    title: '猫猫 v0.3.0：物资管理重写 + SOP 导航重构',
    date: '2026-07-10',
    tags: ['猫猫', '架构'],
    body: `猫猫手册第三次大版本。物资管理从清单列表重写为表格风格（导入 Excel 数据），SOP 导航重构统一美化排版。编年史改为垂直时间轴，手风琴默认展开，新增绝育记录。首页统合（移除猫咪档案独立 Tab），筛选栏值重命名，统计卡片标签趣味化。`,
  },
  {
    id: 'devnotes-v011',
    title: '开发笔记 v0.1.1：笔记中心新增两篇技术文章',
    date: '2026-07-10',
    tags: ['开发笔记', '内容'],
    body: `从熊窝 cookbook 移植两篇文章到开发笔记：纯静态站点五层渲染模型、腾讯云+GitHub+Vercel 部署全流程。Markdown → HTML 转换，补全 product/stacks/langs/type 字段体系。`,
  },
  {
    id: 'personal-v060',
    title: '熊窝 v0.6.0：Cookbook 改为个人开发时间线',
    date: '2026-07-10',
    tags: ['熊窝', '重构'],
    body: `所有 6 个站点 git 历史统一版本号规则（小写 v、诞生=v0.1.0、新 Tab 大功能=minor bump）。Cookbook Tab 从「技术心得」改为「个人开发时间线」，记录自有项目的里程碑演进。`,
  },
  {
    id: 'home-v090',
    title: '猪窝 v0.9.0：每日追踪与支出记录从 personal 迁移至 home',
    date: '2026-07-11',
    tags: ['猪窝', '架构'],
    body: `猪窝承接 personal 的「每日追踪」能力。新增「每日追踪」Tab（记账 + 日程/睡眠），原 personal 的日历/记账数据迁移至此，形成家庭生活全记录主站。

## 内容
- 从 personal 迁移并补全「支出记录」Tab
- 每日记账、日程、睡眠统一在 home 管理`,
  },
  {
    id: 'personal-v070',
    title: '熊窝 v0.7.0：新增个人开发时间线同步脚本 sync-timeline.py',
    date: '2026-07-10',
    tags: ['熊窝', '功能'],
    body: `- scripts/sync-timeline.py：对比各仓库 main 带版本号 commit 与时间轴
  data.js 已记录的最高大版本，自动把「高于时间轴」的大版本补进时间轴
- 基准 = 时间轴 data.js 自身（不依赖外部 state 账本），patch/历史缺口不回填
- 提供 --status / --dry-run（不写文件）与安全默认（只改 data.js，不 commit/push）
- index.html 版本 meta 同步 v0.6.0 → v0.7.0`,
  },
  {
    id: 'personal-v080',
    title: '熊窝 v0.8.0：移除日历/记账 Tab（迁移至 home）',
    date: '2026-07-11',
    tags: ['熊窝', '架构'],
    body: `熊窝回归纯个人主页定位。移除日历/记账两个 Tab 及其构建管线（build-diary.py 等），相关能力已整体迁移至 home「每日追踪」。

## 架构
- 删除 calendar/expense 两 Tab 与对应 JS 数据文件
- 日记数据改由 home 编译，personal 不再持有`,
  },
  {
    id: 'lifenotes-v040',
    title: '常识笔记 v0.4.0：架构升级为独立内容库与视频入库工作流',
    date: '2026-07-16',
    tags: ['常识笔记', '架构'],
    body: `- 将 59 篇 Markdown 迁入仓库内 content/，取消 Obsidian 运行时依赖
- 新增视频转写 inbox，并让构建跳过内部目录
- 补充独立构建依赖、项目规则、版本元数据和完整工作流文档
- 保持 11 个领域的生成内容与迁移前一致`,
  }
];

const membershipRecords = [
  // ===== 已过期（10 条，到期 < 2026-07-08）=====
  { name: 'monica',                    expireDate: '2026-03-10', price: 865.42, cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'ksqnm',                     expireDate: '2025-02-18', price: null,    cycleMonths: 12, tags: ['其他'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'wpsai会员',                 expireDate: '2025-05-07', price: null,    cycleMonths: 12, tags: ['工具'], note: '学生认证送了三个月', source: 'Notion 会员表', url: '' },
  { name: 'wink',                      expireDate: '2026-02-02', price: 138,    cycleMonths: 12, tags: ['工具'], note: '平时18一个月，优惠78元', source: 'Notion 会员表', url: '' },
  { name: 'csdn',                      expireDate: '2026-05-07', price: 214.76, cycleMonths: 12, tags: ['工具'], note: '新春优惠70元，并送3个月', source: 'Notion 会员表', url: '' },
  { name: 'ChatGPT Plus 会员 1',       expireDate: '2026-06-07', price: 29,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: 'claude 原版',               expireDate: '2026-06-15', price: 88,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: 'ChatGPT Plus 会员 2',       expireDate: '2026-06-20', price: 29,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: '爱奇艺',                    expireDate: '2026-02-14', price: 138,    cycleMonths: 12, tags: ['视频'], note: '平时25一个月，优惠了162', source: 'Notion 会员表', url: '' },
  { name: '一生足迹',                  expireDate: '2025-11-12', price: null,    cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },

  // ===== 未过期（20 条，到期 >= 2026-07-08 或空）=====
  { name: 'OpenCode Go 1',             expireDate: '2026-07-17', price: 35,     cycleMonths: 1,  tags: ['AI'], note: '这个是用 1357953389 的 GitHub 登录的', source: '手动新增', url: 'https://opencode.ai/go' },
  { name: 'OpenCode Go 2',             expireDate: '2026-07-30', price: 35,     cycleMonths: 1,  tags: ['AI'], note: '用耿梦🫎的谷歌账号登录', source: '手动新增', url: 'https://opencode.ai/go' },
  { name: 'minimax-m3-plus',           expireDate: '2026-08-01', price: 49,     cycleMonths: 1,  tags: ['AI'], note: '', source: '手动新增', url: '' },
  { name: 'ChatGPT Plus',              expireDate: '2026-08-12', price: 25,     cycleMonths: 1,  tags: ['AI'], note: '登录账号为 erbaysalim0387@gmail.com', source: '手动新增', url: '' },
  { name: '88vip➕网易云➕优酷年会员',  expireDate: '2026-09-30', price: null,   cycleMonths: 12, tags: ['购物'], note: '', source: 'Notion 会员表', url: '' },
  { name: '百度云',                    expireDate: '2026-09-13', price: 158,    cycleMonths: 12, tags: ['网盘'], note: '学生优惠158一年', source: 'Notion 会员表', url: 'https://pan.baidu.com/comps/view/MV8xMDg5XzEzNDlfMzgyN19vbmxpbmU=/1780909596893?&activity_id=963521758612&shareType=link' },
  { name: 'wps超级会员',               expireDate: '2026-11-30', price: 79,     cycleMonths: 12, tags: ['工具'], note: '2年158元，折合79/年（比88学生单年更划算）', source: 'Notion 会员表', url: 'https://personal-act.wps.cn/rubik2/portal/HD2025062313463058/YM2025111816522242?cs_from=pc_paywin_icon_mkt_dbwrz&mk_key=P0iFpm4eH6tvMNOT9vs3k34LlqRX7gbU1wypg6Ea&position=pc_paywin_icon_mkt_dbwrz&tab=stu&active-nav-key=stu_area' },
  { name: '爱奇艺体育会员（非爱足球）', expireDate: '2027-01-12', price: null,   cycleMonths: 24, tags: ['视频'], note: '买两年迅雷会员送的', source: 'Notion 会员表', url: '' },
  { name: '京东plus',                  expireDate: '2027-02-05', price: 49.5,   cycleMonths: 24, tags: ['购物'], note: '只要 618 左右去买这个京东的双年卡就可以了，应该需要在京东 PLUS 失效的前提下去买。', source: 'Notion 会员表', url: '' },
  { name: '网易云音乐',                expireDate: '2027-02-17', price: 108,    cycleMonths: 12, tags: ['音乐'], note: '平时45一季，一年180，优惠72；学生优惠（22岁以下）60一年\n88vip送344天 2025.10.22 领取', source: 'Notion 会员表', url: '' },
  { name: '梯子',                      expireDate: '2027-05-03', price: 147.6,  cycleMonths: 12, tags: ['其他'], note: '', source: 'Notion 会员表', url: '' },
  { name: '鲨鱼记账',                  expireDate: '2027-05-04', price: null,   cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'b站',                       expireDate: '2027-12-30', price: null,   cycleMonths: 12, tags: ['视频'], note: '', source: 'Notion 会员表', url: '' },
  { name: '迅雷',                      expireDate: '2028-05-22', price: 164,    cycleMonths: 12, tags: ['网盘'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'microsoft 365',             expireDate: '',           price: 239,    cycleMonths: 12, tags: ['工具'], note: '平时每个月38块，一年456，直接省两百多', source: 'Notion 会员表', url: '' },
  { name: 'qq音乐',                    expireDate: '',           price: 108,    cycleMonths: 12, tags: ['音乐'], note: '平时45一季，一年180，优惠72｜财富自由再开通', source: 'Notion 会员表', url: '' },
  { name: '剪映',                      expireDate: '',           price: 298,    cycleMonths: 12, tags: ['工具'], note: '无效优惠，平时也是一个月25，就优惠了两块', source: 'Notion 会员表', url: '' },
  { name: '夸克（两年）',              expireDate: '',           price: 208,    cycleMonths: 24, tags: ['网盘'], note: '平时新开的话9块一个月，看剧时充一下就行', source: 'Notion 会员表', url: '' },
  { name: '夸克➕优酷（电视端）➕88vip➕网易云➕饿了么年卡', expireDate: '', price: 160, cycleMonths: 12, tags: ['购物'], note: '', source: 'Notion 会员表', url: '' },
  { name: '全民k歌',                   expireDate: '',           price: 168,    cycleMonths: 12, tags: ['音乐'], note: '平时有些时候开一个月才6元，想开再用', source: 'Notion 会员表', url: '' },
  { name: '腾讯+京东',                 expireDate: '',           price: 198,    cycleMonths: 12, tags: ['购物'], note: '心动但确实没必要，等以后可以赚钱了再说，不然一年得买17笔运费才够开通费的', source: 'Notion 会员表', url: '' },
];
