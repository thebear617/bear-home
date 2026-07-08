const recordLabel = '任务数';

const manualRecords = {
};

const routeCategories = [
  {
    title: '🏠 个人站点',
    items: [
      { name: '猪窝', desc: '家居生活管理与美食记录', url: 'https://pig.thebear617.cn/' },
      { name: '猫猫', desc: '猫协档案与疫苗绝育追踪', url: 'https://cat.thebear617.cn/' },
      { name: '熊窝（个人主页）', desc: '个人主页、日历追踪与支出记录', url: 'https://me.thebear617.cn/' },
      { name: '表征学习', desc: '表征学习知识体系', url: 'http://rep.thebear617.cn/' },
      { name: '租房对账表', desc: '租房看房清单', url: 'http://rent.thebear617.cn/' },
    ]
  },
  {
    title: '💻 代码仓库',
    items: [
      { name: 'htmls', desc: '所有个人站点源码合集', path: '~/Documents/htmls' },
    ]
  },
  {
    title: '📝 笔记与文档',
    items: [
      { name: 'Obsidian Vault', desc: '知识库与笔记', path: '~/Documents/notes' },
    ]
  },
];

const cookbookEntries = [
  {
    id: 'ui-layers',
    title: '纯静态站点的五层渲染模型',
    date: '2026-07-07',
    tags: ['架构', 'UI'],
    body: `## 层级

\`Page → Tab → Section（X 样式）→ Item（Y 样式）→ 点击行为\`

三层数据和两层样式完全解耦：

| 层 | 角色 | 谁决定 |
|------|------|------|
| Page | 整个页面 | 唯一 |
| Tab | 功能视图切换 | 数据文件 |
| Section | 数据分组容器 | 数据 + 渲染样式 |
| Item | 单条数据记录 | 数据 + 渲染样式 |
| 点击 | Item 被点击后做什么 | 交互逻辑 |

## Section 渲染形式

- **Accordion** — 手风琴折叠面板，点标题展开/收起
- **Summary Grid** — 横排大数字统计卡片
- **Plain Container** — 无额外壳，直接装 Item

## Item 渲染形式

- **Card Grid** — 卡片网格，名称 + 描述，2~3 列
- **Pill Bar** — 横向圆角胶囊标签，可换行
- **Photo Card** — 图片 + 名称，网格排列
- **Table Row** — 紧凑多列表格行

## 点击行为

- **外链跳转** — \`<a target="_blank">\`
- **打开抽屉** — 同页侧滑面板显示详情
- **筛选** — 点击后过滤其它区域数据

## 实例

### 猫猫手册首页

\`Page（猫猫首页）→ Tab（首页/编年史/物资…）→ Section[Summary Grid]（统计卡片）→ 点击[筛选]\`

\`→ Section[Plain] → Item[Photo Card]（每只猫）→ 点击[打开抽屉]\`

### 熊窝路由表

\`Page（熊窝）→ Tab（路由表/日历/支出…）→ Section[Accordion]（🏠 个人站点）→ Item[Card Grid]（猪窝/猫猫…）→ 点击[外链跳转]\`

## 使用心得

1. 原本是表格的数据，倾向于直接用表格渲染。参考猫猫网站的物资管理页面。
2. 站点跳转的统筹，如果不想暴露裸链接、也不想排版全堆在左侧，可以试网格卡片。参考个人网站路由表。
`,
  },
  {
    id: 'deploy-vercel',
    title: '从域名到上线：腾讯云 + GitHub + Vercel 部署全流程',
    date: '2026-07-05',
    tags: ['部署', '域名', 'Vercel'],
    body: `## 步骤

1. 在腾讯云购买域名 thebear617.cn，记得勾选禁止转移锁，完成实名认证
2. 在 GitHub 创建想要部署的仓库，push代码
3. 在 Vercel 上Import对应代码仓库，然后创建 Pproject，直接部署
4. 在 Vercel 项目 Settings → Domains 添加 www.thebear617.cn 和 thebear617.cn
5. 在腾讯云 DNS 添加 A 记录 和 CNAME 记录，按照Vercel 给的配即可，等待 Vercel 验证通过，自动签发 SSL，域名上线

## 参考

- [CSDN · 2026最新 Vercel 自动化部署与自定义域名配置教程](https://blog.csdn.net/qq_57376018/article/details/160097635)
`,
  },
];

const expenseCategories = [
  { name: '居家生活', icon: '🏠', subs: ['居家', '做饭', '洗漱', '洗衣服', '维修', '快递'] },
  { name: '通讯订阅', icon: '📱', subs: ['通讯', '话费套餐', 'vip'] },
  { name: '形象装扮', icon: '👔', subs: ['服饰', '美容'] },
  { name: '市内出行', icon: '🍜', subs: ['外出餐饮', '借充电宝', '市内交通'] },
  { name: '娱乐消费', icon: '🎮', subs: ['娱乐', '游戏充值', '抓娃娃', '彩票'] },
  { name: '自我提升', icon: '📚', subs: ['学习', '办公', '运动健身'] },
  { name: '电子产品', icon: '💻', subs: ['数码产品', '数码配件', '大家电', '小家电'] },
  { name: '人情社交', icon: '🤝', subs: ['社交', '亲友', '节日', '纪念', '长辈', '爸爸妈妈', '孩子', '宝贝'] },
  { name: '市外出行', icon: '✈️', subs: ['跨省交通', '住房', '旅行中途餐饮'] },
  { name: '猫协救助', icon: '🐱', subs: ['宠物'] },
  { name: '医疗保健', icon: '🏥', subs: ['医疗'] },
];

const expenseRecords = [
  { date: '2026-07-06', cat: '市内出行', sub: '外出餐饮', amount: 24.88, note: '千里香馄饨、兵立王奶茶' },
  { date: '2026-07-06', cat: '市内出行', sub: '外出餐饮', amount: 13.50, note: '丁香食堂' },
  { date: '2026-07-07', cat: '市内出行', sub: '外出餐饮', amount: 14.00, note: '竹园减脂餐（煎鸡排饭）' },
  { date: '2026-07-07', cat: '市内出行', sub: '外出餐饮', amount: 20.00, note: '东北烧烤' },
  { date: '2026-07-07', cat: '居家生活', sub: '居家', amount: 40.00, note: '零食' },
  { date: '2026-07-07', cat: '市内出行', sub: '外出餐饮', amount: 2.00, note: '买水' },
  { date: '2026-07-08', cat: '市内出行', sub: '外出餐饮', amount: 13.00, note: '竹园餐厅三合一+绿豆沙' },
  { date: '2026-07-08', cat: '市内出行', sub: '市内交通', amount: 23.10, note: '送赫兹去医院打车费' },
  { date: '2026-07-08', cat: '市内出行', sub: '外出餐饮', amount: 76.90, note: '原力场老友粉+螺蛳鸭脚煲' },
  { date: '2026-07-08', cat: '形象装扮', sub: '服饰', amount: 69.50, note: '帽子' },
  { date: '2026-07-08', cat: '市内出行', sub: '外出餐饮', amount: 20.00, note: '兴隆夜市烧烤' },
  { date: '2026-07-08', cat: '人情社交', sub: '纪念', amount: 24.00, note: '纪念品相册手帐' },
];
