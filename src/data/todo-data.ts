export interface TodoItem {
  id: string;
  title: string;
  url?: string;
  status: 'todo' | 'doing' | 'done';
  note?: string;
  createdAt?: string;
  date?: string;
  plannedStart?: string;
  plannedEnd?: string;
  // 可选的整点排期。两端同时存在时，任务可在甘特图的「按小时」视图中查看。
  plannedStartTime?: string;
  plannedEndTime?: string;
  completedAt?: string;
}

export interface TodoBoard {
  id: string;
  name: string;
  icon: string;
  items: TodoItem[];
}

export const TODO_BOARDS: TodoBoard[] = [
  {
    id: 'summary',
    name: '汇总',
    icon: '📊',
    items: []
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l32', title: "猫猫：合作-1931 商量周边", status: 'todo', date: '2026-09-09', createdAt: '2026-09-01', url: "", note: "" },
      { id: 'l49', title: "学费：学期注册｜缴纳 11200 元", status: 'todo', date: '2026-09-19', createdAt: '2026-09-19', url: "", note: "住宿费 1200元，学费 10000 元" },
      { id: 'l50', title: "聚会：和同门聚会", status: 'todo', date: '2026-09-19', createdAt: '2026-09-19', url: "", note: "潮汕牛肉火锅｜铁锅炖｜重庆火锅｜湘菜｜烧烤烤肉｜江西菜" },
      { id: 'l48', title: "成长数据库-录入数据｜｜论文｜会议参加｜研究生活动", status: 'todo', date: '2026-09-21', createdAt: '2026-09-18', url: "https://ygb.xidian.edu.cn/info/1036/13523.htm", note: "请所有同学先尽快进行成长数据库的录入｜系统将于2026年9月21日截止，之后本人不能新增成果或进行修改，未录入的成果不能评奖使用。" },
      { id: 'l47', title: "医院：3 点去校医院皮肤科看皮肤疣", status: 'todo', date: '2026-09-16', createdAt: '2026-09-15', url: "", note: "确诊 HPV 引起的皮肤疣——已用激光治疗" },
      { id: 'l42', title: "和梓健哥他们聚一聚——田、董、赵、郑、陆、张、我、马、吴", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "下周六（9 月 12 日）和他们约着聚一聚，郑炟、董传天、田均恺、陆才、梓健哥、马钰程、赵钰彬、韩耀文" },
      { id: 'l43', title: "猪窝：日程和财务", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "把每日追踪、支出记录（攒钱计划、定期支出）、会员订阅看能否集成到一块" },
      { id: 'l46', title: "研究生选课", status: 'todo', date: '2026-09-08', createdAt: '2026-09-05', url: "https://gr.xidian.edu.cn/info/1037/20494.htm", note: "指定计划：9月8日9:00至9月18日17:00；选课：9月8日14:00至9月18日17:00。" },
      { id: 'l45', title: "猪窝：美食记录升级", status: 'todo', date: '2026-09-08', createdAt: '2026-09-05', url: "", note: "集成做菜记录➕菜谱➕食材存放甘特图➕价格图" },
      { id: 'l44', title: "购买一个 在家喝的500ml的水瓶", status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: "https://item.jd.com/100135363038.html?pcdk=stPamDq6YyH3dOCYnsmj539riQCTQKktAH1iqhinti2pPavR2ev4votaoc0caxqi.rQ4a.tlbT&spmTag=YTAyMTkuYjAwMjM1Ni5jMDAwMDcyMTAua2V5d29yZF9lbnRlciU0MDE3ODg1MDkzNzczNTYlMjMxNzgwOTAzMzUyNzI3OTM0MzgwMTk0JTIzMTM1MzYzMDAzMiUyQ2EwMjQwLmIwMDI0OTMuYzAwMDA0MDI3LjIlMjNza3VfY2FyZCU0MDE3ODg1MTAyNzUzNDclMjMxNzgwOTAzMzUyNzI3OTM0MzgwMTk0JTIzNzkzMDU0NjI2", note: "500mL 水瓶 透明 宽口 耐热 密封｜已找到，价格为 14.31，还需要一个防尘盖" },
      { id: 'l8', title: "带赫兹去博辰复诊，顺便回学校收拾东西", status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: "", note: "赫兹口炎治疗（441）后续" },
      { id: 'l39', title: "商量月饼选择", status: 'todo', date: '2026-09-02', createdAt: '2026-09-02', url: "", note: "和宝宝老妈商量今年中秋送什么月饼" },
      { id: 'l40', title: '更新一下攒钱计划，把美团的钱还上', status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: '', note: '' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c29', title: "熊电台 v0.3.0：支持模型显示｜标签交互｜UI / UX优化｜APP名字图标更换", status: 'todo', date: '2026-09-23', createdAt: '2026-09-23', url: "", note: "① 支持模型显示： 内部可以看到模型信息\n② 支持标签交互：支持拖拽和重命名\n③ UI / UX优化：进行中/思考中的会话动效（标签栏动效及内容区动效）｜接入会话 UI 优化\n④ APP名字图标更换：好听的名字｜配图" },
      { id: 'c26', title: "熊电台-v0.1.0~v0.2.0 : APP 化｜窗口适配｜四个后端适配｜UI 热更新｜UI 美化", status: 'todo', date: '2026-09-19', createdAt: '2026-09-19', url: "", note: "痛点：单显示器时会话的聊天框之外的区域太冗余，很占视觉，想做成像 GPT 那样的只有一条横条输入框的感觉" },
      { id: 'c10', title: "聊天站：基础功能搭建｜4328 和 4331 的网关调试", status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: "https://www.bilibili.com/video/BV11mNA6vEJX", note: "顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的" },
      { id: 'c28', title: "待开发：话术/话题本｜素材/组件库   待完善：仪表盘｜聊天站", status: 'todo', date: '2026-09-23', createdAt: '2026-09-23', url: "", note: "" },
      { id: 'c27', title: "画廊：收录 pipeline ｜前端 UI｜PPT 风格", status: 'todo', date: '2026-09-21', createdAt: '2026-09-21', url: "", note: "" },
      { id: 'c25', title: "校招会：腾讯南校区宣讲会", status: 'todo', date: '2026-09-15', createdAt: '2026-09-15', url: "", note: "19-21：00 ｜B101 报告厅" },
      { id: 'c30', title: "猫猫 v0.16.0：补齐猫咪档案数据与字段", status: 'done', date: '2026-09-12', createdAt: '2026-09-10', url: "", note: "" },
      { id: 'c31', title: "猫猫 v0.17：重构详情悬浮窗｜财务公示", status: 'done', date: '2026-09-15', createdAt: '2026-09-12', url: "", note: "含 v0.17.0 重构猫咪详情悬浮窗、v0.17.1 精简详情悬浮窗并优化移动端、v0.17.2 财务公示 Tab 与侧边栏收口" },
      { id: 'c24', title: "猫猫 v0.18：财务公示页面优化｜行动甘特图｜编年史改造｜知识库分页", status: 'todo', date: '2026-09-25', createdAt: '2026-09-10', url: "", note: "① 财务公示页面优化\n② 行动甘特图：绝育 / 疫苗 / 救助三条线\n③ 编年史改造：改成猪窝日程那种形态\n④ 知识库：增加分页逻辑，并往公众号引流\n⑤ 赞助：尝试接进 CRM 管理" },
      { id: 'l41', title: "熊窝：CRM 初发搭建，视觉及逻辑建立，未完善数据字段", status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: "", note: "" },
      { id: 'l1', title: "猪窝 v1.16：相簿升级｜分类学设计｜照片分拣｜字段录入", status: 'todo', date: '2026-09-25', createdAt: '2026-07-19', url: "", note: "① 相簿升级：情侣相册整体升级为「相簿」，旧数据与入口一起迁过来\n② 分类学设计：定分类维度（时间 / 人物 / 场景 / 主题）与相簿层级\n③ 照片分拣：把现有 iCloud 情侣相册按分类整理进相簿\n④ 字段录入：规定相簿字段并批量录入" },
      { id: 'c23', title: "小米内测申请", status: 'todo', date: '2026-09-10', createdAt: '2026-09-09', url: "https://mimo.xiaomimimo.com/desktop/invite/apply/", note: "UID 为：2419851359" },
      { id: 'c11', title: "开发笔记，常识笔记：整理笔记内容，缩减非必要笔记，重构分类学", status: 'todo', date: '2026-09-04', createdAt: '2026-09-03', url: "", note: "1. 开发笔记：典型案例改为实现流程、SOP\n2. 常识笔记：领域大调整，按经济行业和非经济行业来分" },
      { id: 'c32', title: "熊窝 v0.33：任务搁置｜命名规范｜三视图｜甘特图优化", status: 'done', date: '2026-09-23', createdAt: '2026-09-23', url: "", note: "① v0.33 搁置：等待 / 被挤掉排期的进行中任务可一键搁置（从甘特图下线、等待期在轴上留白），排期与阶段全保留；恢复时原日期原样回轴，原计划已过期则「恢复并顺延」；搁置项收进「进行中」列底部折叠区\n② v0.33 命名规范：新增 / 编辑弹窗按「站点 v版本：需求一｜需求二」拼标题——站点下拉（9 个短名）、版本框以该站当前版本作占位、需求名称与具体需求双向联动、需求清单自动编号 ①②③\n③ v0.33 复盘视图：视图改成「看板 / 甘特图 / 复盘」三个 tab——已完成任务不再上甘特图轴，改按周分组的复盘清单（阶段时长比例条 + 每页约 20 条分页）；过去一年热力图从 header 收进复盘 tab\n④ v0.33 甘特图：阶段名不再按 4 字硬截断（够宽显示全名、窄到放不下时只留序号）、任务标题两行；图例改「已完成阶段」\n⑤ v0.33 细节修复：归档与活动任务撞 id 导致的状态串号（已完成的旧记录被套上搁置 / 排期）；目标日期改成可选的意向日、相对时间说人话；任务弹窗关掉浏览器表单历史提示" },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r7', title: "CVPR 2027：粒度细化｜模态对齐｜prompt 改进", status: 'todo', date: '2026-11-07', createdAt: '2026-09-13', url: "", note: "摘要 北京时间：2026-11-08 19:59｜全文 北京时间：2026-11-14 19:59\n模态对齐：多模态对齐，知识图谱\n粒度细化： 语义分割-  实例分割｜ 细粒度" },
      { id: 'r6', title: "组内：科研，做大组会 PPT", status: 'todo', date: '2026-09-18', createdAt: '2026-09-06', url: "", note: "" },
      { id: 'r5', title: "大组会工作总结准备", status: 'todo', date: '2026-09-06', createdAt: '2026-09-03', url: "", note: "周日早上九点：学期工作总结和计划汇报" },
    ]
  }
];
