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
    id: 'tool-sync-timeline',
    title: '建立个人开发时间线自动同步系统',
    date: '2026-07-20',
    tags: ['熊窝', '工具'],
    body: `建立了个人开发时间线自动同步系统：脚本检测版本缺口 + Git hook 提醒 + Agent skill 按流程生成条目。

## 组件
- scripts/sync-timeline.py：遍历 6 个站点 git log，按完整版本号（major.minor.patch）检测时间线缺口，支持 --json 输出供 Agent 消费
- scripts/git-hooks/post-commit：每次 personal 仓库提交后自动检测版本缺口并打印提示
- ~/.agents/skills/sync-timeline/SKILL.md：Agent 工作流规则，按文件变更量自动选择精简或详细 body 风格

## 设计决策
- 比较逻辑从按 (major,minor) 分组改为按完整版本号比对所有已存在版本，不再遗漏中间版本（如 v0.3.1 → v0.4.2 之间的 v0.4.1）
- Git hook 只在 personal 仓库触发，不扩散到所有站点
- 条目正文由 Agent 根据 git diff 分析生成：≤10 文件精简摘要，>10 文件结构化 Markdown
- 新站点先列出所有版本让用户确认，再批量导入
- 脚本只改 data.js，不自动 commit / push

## 首次同步
运行 sync-timeline.py 后一次性补全 20 条缺失版本，覆盖全部 6 个站点，时间线从 33 条扩至 53 条。`,
  },
  {
    id: 'tool-ohmyzsh',
    title: '安装 Oh My Zsh：经典 ZSH 配置管理框架',
    date: '2026-07-17',
    tags: ['工具', '功能'],
    body: `安装了 Oh My Zsh，一个管理 ZSH 配置的经典框架。它内置主题、插件与大量社区维护的开箱即用功能，极大简化了 shell 环境的定制——但本质是个「配置框架」，并不会自动提供一个完整的「配置档案切换器」，切换逻辑通常要自己在 <code>~/.zshrc</code> 里写。

## 用法一：直接修改当前配置

在 <code>~/.zshrc</code> 里切换主题、插件和别名：

    ZSH_THEME="robbyrussell"

    plugins=(
      git
      npm
      docker
    )

    alias ll="ls -lah"
    alias c="clear"

改完执行 <code>source ~/.zshrc</code> 即可生效。

## 用法二：多套配置方案

分别建立不同场景的配置文件，再在 <code>~/.zshrc</code> 中选载：

    ~/.zshrc.work
    ~/.zshrc.dev
    ~/.zshrc.minimal

<code>~/.zshrc</code> 中用变量选择加载哪一套：

    ZSH_PROFILE="dev"

    case "$ZSH_PROFILE" in
      work)    source ~/.zshrc.work ;;
      dev)     source ~/.zshrc.dev ;;
      minimal) source ~/.zshrc.minimal ;;
    esac

例如开发配置 <code>~/.zshrc.dev</code>：

    ZSH_THEME="robbyrussell"

    plugins=(
      git
      npm
      docker
    )

    alias gs="git status"
    alias devserver="npm run dev"

工作配置 <code>~/.zshrc.work</code> 则可以是：

    ZSH_THEME="agnoster"

    plugins=(
      git
      macos
    )

    alias notes="cd ~/notes"

切换时改 <code>ZSH_PROFILE="work"</code>（或对应值），再运行 <code>source ~/.zshrc</code> 即可。

## 核心组织维度

围绕以下维度即可组织出不同的配置方案：

    Oh My Zsh
    ├── 主题
    ├── 插件
    ├── 别名
    ├── 环境变量
    └── 自定义函数

只是「切换」这一步通常需要自己在 <code>.zshrc</code> 里写。

## 项目
- GitHub：https://github.com/ohmyzsh/ohmyzsh`,
  },
  {
    id: 'tool-tabby',
    title: '安装 Tabby 终端：新一代跨平台终端模拟器',
    date: '2026-07-17',
    tags: ['工具', '功能'],
    body: `安装了 Tabby 终端模拟器，替代系统默认终端。支持多标签、分屏、SSH 客户端、主题自定义。

## 项目
- GitHub：https://github.com/Eugeny/tabby`,
  },
  {
    id: 'tool-zsh-autosuggestions',
    title: '安装 zsh-autosuggestions 插件：终端命令智能补全',
    date: '2026-07-17',
    tags: ['工具', '功能'],
    body: `安装了 zsh-autosuggestions 插件，基于历史记录和自动补全，终端输入命令时自动给出灰色建议，按 → 键即可采纳。

## 项目
- GitHub：https://github.com/zsh-users/zsh-autosuggestions`,
  },
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
  },
  {
    id: 'cross-git-email-rewrite-2026-07-17',
    title: 'github 贡献图根因检查及修复',
    date: '2026-07-17',
    tags: ['Git', '工具'],
    body: `GitHub 贡献图一直只显示 66 contributions。诊断发现：6 个仓库的 author email 一直是 <code>1357953389@icloud.com</code>，但 GitHub 账号 <code>thebear617</code> 绑定的 verified email 是 <code>@qq.com</code>——所有 commit 都因为 email 不匹配被「无主」处理，从未算进贡献图。

## 决策
- 不再绑 icloud 邮箱（已不常用），而是把所有历史 commit 的 author email 改成 <code>@qq.com</code>
- 同时改 <code>git config user.email</code>，让未来 commit 也用 <code>@qq.com</code>
- 一并改写历史需要 force-push，因为 6 个仓库都是个人维护的站，可控

## 执行步骤
1. 三个仓库（home / devnotes / lifenotes）有未提交改动，先 <code>chore: 备份前提交未完成改动</code> commit
2. 6 个仓库全部 <code>git bundle create</code> 备份到 <code>$TMPDIR</code>（41M）
3. 每个仓库的 <code>.git/config</code> 追加 <code>[user] email = 1357953389@qq.com</code>
4. 每个仓库跑 <code>git filter-branch --env-filter</code> 改写 author/committer email
   - 共改写 351 个 commit：cats 72、home 122、personal 81、devnotes 8、lifenotes 15、reanotes 53
   - <code>home</code> 还连带改写了 3 个 tag（v1.0-pre-markdown / v1.1.0 / v1.2.0）
5. 删除 <code>refs/original/</code> 备份 refs，<code>git reflog expire --expire=now --all && git gc --prune=now --aggressive</code>
6. 6 个仓库 <code>git push --force-with-lease origin main</code> 全部成功

## 关键技术点
- <code>filter-branch</code> 在脏仓库上会拒绝，必须先 commit 或 stash；选 commit 因为 stash pop 有冲突风险
- <code>--force-with-lease</code> 比 <code>--force</code> 安全：远程若被别人推过会被拒绝
- email 改写会让<strong>所有 commit hash 全部变化</strong>，旧 hash 引用的 PR / issue / 外部文档会失效
- 系统已装了 <code>git-filter-repo</code> 的替代品缺失，但 <code>filter-branch</code> 对 351 个 commit 总量只要 ~20 秒，可用

## 修复后预期
- GitHub 会在 5–10 分钟内重新计算贡献图
- 过去所有 commit 都会被算进 <code>thebear617</code> 的 <code>@qq.com</code> 身份下`,
  },
  {
    id: 'personal-v0120',
    title: '熊窝 v0.12.0：新增英雄联盟与每日看板',
    date: '2026-07-18',
    tags: ['熊窝', '功能'],
    body: `熊窝新增「英雄联盟」与「每日看板」两个核心板块，个人主页从站点导航与开发记录进一步扩展为游戏攻略、轻量任务管理并存的个人工作台。

## 英雄联盟
- 录入法师公式 3.0、ADC 公式 4.0、AP 刺客 3.0 三套攻略视图
- 使用标签在三套公式间切换，装备与英雄图片全部本地托管
- AP 刺客拆分带咒刃统一公式与六名不带咒刃英雄独立方案
- 桌面与手机端均采用响应式布局，无 CDN 图片依赖

## 每日看板
- 提供视频、科研、编程、生活四个任务分类
- 使用待办、进行中、已完成三列展示当天任务
- 进行中任务允许跨天，已完成任务支持按分类和日期归档
- 首批录入 3 条待转录视频任务

## 修复与发布
- 修复 TodoBoard 组件未加载导致的空白页
- 修正带参数筛选器误放 computed 导致的渲染中断
- 以 v0.12.0 大版本发布并同步 README、CHANGELOG 与本地资源`,
  },
  {
    id: 'home-v061',
    title: '猪窝 v0.6.1：v0.6.1: 美食记录餐型前缀，做饭次数按餐型统计',
    date: '2026-07-09',
    tags: ['猪窝', '功能'],
    body: `- 数据结构改造：foodRecords 从「日期→单条记录」改为「日期→多餐数组」，每餐带 meal 字段（中饭/晚饭/早饭等）
- 显示优化：详情面板按餐分块，每块顶部显示餐型标签（如「中饭」红色胶囊），多餐后用分隔线区隔，方便一眼区分中饭/晚饭
- 统计修正：做饭次数改为仅统计 meal 为「中饭」或「晚饭」的餐数（早饭不计入），与用户口径一致；同日中饭+晚饭算 2 次
- 7.9 三道菜归入同一「中饭」餐（青椒土豆丝1.5+红油凉皮2+火腿肠泡面4.5）；历史 4 条默认标记为「中饭」
- 新增 CSS：.food-meal-block / .food-meal-head / .food-meal-tag 餐型标签样式`,
  },
  {
    id: 'home-v091',
    title: '猪窝 v0.9.1：特殊纪念日程日历高亮+图标 + 日记更新至7/20',
    date: '2026-07-20',
    tags: ['猪窝', '功能'],
    body: `- build-diary.py: 从 special-keywords.json 读取关键词→图标映射（非硬编码），每天最多一个图标
- diary-data.js: 新增 specialEvents 输出（3天：6/10毕业🎓、6/17生日🎂、7/20天台日出🌅）
- app.js/css: cal-special 金色渐变底色+左边框+图标行
- data.js: 7/20 电费余额 39.27
- 日记更新: 7/19 追加 devnotes Vue→Astro 迁移详情 + 跨天打电动，新建 7/20 日程
- 支出更新: 7/20 黄家泡馍 26元`,
  },
  {
    id: 'personal-v020',
    title: '熊窝 v0.2.0：v0.2.0: 新增支出记录 Tab',
    date: '2026-07-06',
    tags: ['熊窝', '功能'],
    body: `熊窝升级到 v0.2.0：v0.2.0: 新增支出记录 Tab。`,
  },
  {
    id: 'personal-v031',
    title: '熊窝 v0.3.1：个人开发时间线补 reanotes v0.3.1（学术会议与期刊宫格）',
    date: '2026-07-14',
    tags: ['熊窝', '功能'],
    body: `- 手动补 reanotes-v031 条目（2026-07-14）：表征学习板块新增 venues 外链宫格
- sync-timeline.py 仅认 minor 版本，patch 版 v0.3.1 不自动加，故手动补以保持两站版本一致`,
  },
  {
    id: 'personal-v051',
    title: '熊窝 v0.5.1：更新 meta 版本号为 v0.5.1',
    date: '2026-07-10',
    tags: ['熊窝', '功能'],
    body: `熊窝升级到 v0.5.1：更新 meta 版本号为 v0.5.1。`,
  },
  {
    id: 'personal-v081',
    title: '熊窝 v0.8.1：路由表新增常用链接，会员补充 ChatGPT Plus，修复备注列截断',
    date: '2026-07-13',
    tags: ['熊窝', '功能'],
    body: `- 路由表 routeCategories 新增「🔗 常用链接」分类（LDXP 神秘小铺 / OpenTheRank / OpenRouter Rankings），置于「个人站点」之后
- 会员订阅 membershipRecords 新增 ChatGPT Plus（到期 2026-08-12，¥25/月，备注登录账号）
- 修复会员表 .mt-note 单行省略号截断，改为换行完整显示
- 版本 meta v0.8.0 → v0.8.1（patch bump，数据补充+样式微调）`,
  },
  {
    id: 'personal-v0121',
    title: '熊窝 v0.12.1：保留跨日未完成待办',
    date: '2026-07-19',
    tags: ['熊窝', '功能'],
    body: `熊窝升级到 v0.12.1：保留跨日未完成待办。`,
  },
  {
    id: 'devnotes-v020',
    title: '开发笔记 v0.2.0：Vue 3 → Astro 5 重构',
    date: '2026-07-19',
    tags: ['开发笔记', '架构'],
    body: `迁移内容：
- 框架：Vue 3（164KB 运行时）→ Astro 5（零运行时）
- 交互：Vue 组件 → 原生 JS + CSS（~3KB）
- 样式：单一样式表整体迁移，设计 token 不变
- 数据：data-*.js 变更为 ES module，内容无损

架构变化：
- SPA 单页 tab 切换 → 多页路由（/notes /blog /pricing /os）
- 博客模块新增：Astro Content Collections，Markdown 编写
- 侧栏导航从 Vue v-show → <a> 标签独立页面

页面路由：
- /          → 重定向到 /notes/
- /notes/    → 笔记中心（筛选 + 卡片 + 详情展开）
- /blog/     → 博客列表（Markdown 驱动）
- /blog/[slug] → 博客详情
- /pricing/  → 价格矩阵
- /os/       → 操作系统学习指南（章节切换 + 手风琴）

部署：
- 本地：npm run dev
- 构建：npm run build，输出 dist/
- GitHub Pages：SITE_BASE=/devnotes/ npm run build`,
  },
  {
    id: 'devnotes-v021',
    title: '开发笔记 v0.2.1：完善博客表格与项目文档',
    date: '2026-07-20',
    tags: ['开发笔记', '功能'],
    body: `- 新增《开发产品形态与技术栈》博客文章
- 为 Markdown 表格补充边框、表头和横向滚动样式
- README 更新为当前 Astro 5 架构及内容维护流程
- 统一 package 与 lockfile 版本为 0.2.1
- 清理既有博客尾部多余空行`,
  },
  {
    id: 'devnotes-v022',
    title: '开发笔记 v0.2.2：新增全栈文章并完善博客阅读体验',
    date: '2026-07-20',
    tags: ['开发笔记', '功能'],
    body: `- 新增《全栈开发》，补充定义、典型案例、技术类型与常见误区
- 重构并更名《产品形态与技术栈》，调整章节结构与正文内容
- 为博客增加自定义 slug，个人博客使用 personal-blog-setup 稳定地址
- 自动生成二三级目录，支持吸附、锚点跳转与滚动高亮
- 放宽博客正文并完善响应式目录布局
- 支持 ==文本== Markdown 高亮语法并跳过代码块
- 版本升级至 0.2.2`,
  },
  {
    id: 'reanotes-v011',
    title: '科研笔记 v0.1.1：v0.1.1: 首页改为结构化内容',
    date: '2026-06-30',
    tags: ['科研笔记', '功能'],
    body: `科研笔记升级到 v0.1.1：v0.1.1: 首页改为结构化内容。`,
  },
  {
    id: 'reanotes-v032',
    title: '科研笔记 v0.3.2：v0.3.2',
    date: '2026-07-16',
    tags: ['科研笔记', '功能'],
    body: `科研笔记升级到 v0.3.2：v0.3.2。`,
  },
  {
    id: 'reanotes-v040',
    title: '科研笔记 v0.4.0：v0.4.0 引入卡片 Markdown 正文渲染',
    date: '2026-07-16',
    tags: ['科研笔记', '功能'],
    body: `- 新增 content/replearning/supervised/ 目录，存放 ImageNet 预训练范式与监督表示特性两篇正文
- 引入 marked.umd.js 作为客户端 Markdown 解析器（自托管）
- app.js 新增 loadMarkdownCards() 引擎，卡片支持 markdown 字段自动 fetch 渲染
- replearning.js 中两张卡片从内联 HTML 迁移为 markdown 引用
- 微调 CSS 卡片样式适配 markdown-card 状态`,
  },
  {
    id: 'reanotes-v041',
    title: '科研笔记 v0.4.1：发布 v0.4.1',
    date: '2026-07-18',
    tags: ['科研笔记', '功能'],
    body: `科研笔记升级到 v0.4.1：发布 v0.4.1。`,
  },
  {
    id: 'reanotes-v042',
    title: '科研笔记 v0.4.2：发布 v0.4.2 论文翻译与发布工作流',
    date: '2026-07-19',
    tags: ['科研笔记', '功能'],
    body: `将 paper-translate 从工作区工具迁入 ReaNotes 仓库，形成可版本管理、可质量阻断并能直接进入文献库的端到端论文处理能力。

主要变动：
- 串联 MinerU 解析、DeepSeek 分块翻译、Markdown 后处理和 ReaNotes 发布
- 保护公式、图片与 HTML 表格占位符，校验 API 截断和占位符完整性并自动重试
- 将可转换的 HTML 表格展开为 Markdown，处理 rowspan、colspan 与多级表头
- 规范图片替代文本、共享图注和 ./images 本地路径，检查缺图与表格列漂移
- 自动修复高置信度 OCR 公式异常，并保留不确定问题供质量门禁审查
- 建立 publishable、needs_review、blocked 三态质量闸门
- 自动复制中文正文与图片、更新文献索引，并验证 Prettier、lint、VuePress 构建与生成页面
- 提供已有译文的独立发布入口，重试时默认复用 MinerU 结果，避免重复 API 成本
- 补充 README、Skill 说明、迁移文档及 27 项单元与回归测试

真实论文验收：
- 使用 arXiv 2304.12210《A Cookbook of Self-Supervised Learning》完整执行 MinerU 与 DeepSeek
- 修复无 Abstract 时正文从中段开始、多面板图注、公式字体动态加载和 VuePress 图片解析问题
- 将站点公式输出切换为可稳定静态构建的 KaTeX
- 收录中文全文、16 张引用图片、3 个表格和质量报告，并将文献索引改为本地入口
- 最终生成页包含 102 个公式，未发现渲染错误或占位符泄漏

版本迭代：
- 将 ReaNotes 版本提升至 0.4.2
- 补充 v0.4.2 CHANGELOG 和版本入口
- 将私有 output、真实 .env 与 Python 缓存保持忽略`,
  },
  {
    id: 'lifenotes-v011',
    title: '常识笔记 v0.1.1：v0.1.1: 全量迁移至 9 领域',
    date: '2026-07-09',
    tags: ['常识笔记', '架构'],
    body: `- PILOT_DOMAINS 设为 None，编译除「无畏契约」外全部 9 个领域
- 新增板块：宠物 / 生活 / 社会 / 金融-经济 / 动植物 / 历史
- 各域仅编译「领域地图」「QA」（转录 / 术语表 / 来源池 不编译）
- 历史 / 社会 源无上述页面，编译为空板块，附友好空状态提示
- 修复 app.js eyebrow 残留 commonnotes → lifenotes
- 空板块新增 home-empty 提示样式`,
  },
  {
    id: 'lifenotes-v012',
    title: '常识笔记 v0.1.2：v0.1.2: 修复侧边栏导航项点击回跳总览',
    date: '2026-07-10',
    tags: ['常识笔记', '功能'],
    body: `- 根因：renderNav 生成的侧边栏导航 <a> 写死 href="#"，
  点击把 URL hash 清空 → hashchange → route() 解析为空 → 渲染总览仪表盘。
- 修复：叶子项与子项 href 改为真实页面 hash \`#<currentBoard>/<pageId>\`，
  点击由浏览器原生跳转，路由正确渲染对应内容页（保留中键新标签打开）。
- 顶栏「☰ 总览」(href="#") 与板块切换器(href="#<boardId>") 本就正确，未改动。
- V0.1.0：lifenotes 首个标注语义版本号的版本（覆盖全量迁移 + 本导航修复构成的初始可用站点）。`,
  },
  {
    id: 'lifenotes-v021',
    title: '常识笔记 v0.2.1：编译时过滤无价值条目（领域描述、文档骨架、待补TODO）',
    date: '2026-07-10',
    tags: ['常识笔记', '功能'],
    body: `- build-notes.py: parse_map_records 新增过滤逻辑，三种情况跳过：
  (A) 领域描述（H1 + "这个领域用于记录…"）- 首页已有 desc
  (B) 文档结构标题（核心问题/来源沉淀/子主题:xxx 等）- 笔记骨架非记录
  (C) 待补 TODO - 个人任务管理，不应公开
  (D) 仅含标题标签、无正文的空壳条目
- 保留有实质内容的记录（即使分类为"未分类"）
- 效果：29 条垃圾条目被清理，各领域记录列表干净整洁`,
  },
  {
    id: 'cats-v022',
    title: '猫猫 v0.2.2：v0.2.2: 首页统计卡片可点击筛选',
    date: '2026-07-06',
    tags: ['猫猫', '功能'],
    body: `- 首页 5 张统计卡片支持点击作为快捷筛选器，激活态高亮（summary-clickable / summary-active）
- 进入筛选状态后首页改为展示带筛选/搜索控件的猫咪网格；未筛选时保留原照片墙
- 移除排序下拉与 state.sort，统一按猫名拼音排序
- 精简首页统计项为：全部 / 在校 / 已领养 / 已绝育 / 已三针`,
  },
  {
    id: 'cats-v031',
    title: '猫猫 v0.3.1：v0.3.1: 新增区域和性别字段',
    date: '2026-07-07',
    tags: ['猫猫', '功能'],
    body: `猫猫升级到 v0.3.1：v0.3.1: 新增区域和性别字段。`,
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
