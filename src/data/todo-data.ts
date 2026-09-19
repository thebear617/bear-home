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
      { id: 'l49', title: "学费：学期注册｜缴纳 11200 元", status: 'todo', date: '2026-09-19', createdAt: '2026-09-19', url: "", note: "住宿费 1200元，学费 10000 元" },
      { id: 'l50', title: "聚会：和同门聚会", status: 'todo', date: '2026-09-19', createdAt: '2026-09-19', url: "", note: "潮汕牛肉火锅｜铁锅炖｜重庆火锅｜湘菜｜烧烤烤肉｜江西菜" },
      { id: 'l48', title: "成长数据库-录入数据｜｜论文｜会议参加｜研究生活动", status: 'todo', date: '2026-09-21', createdAt: '2026-09-18', url: "https://ygb.xidian.edu.cn/info/1036/13523.htm", note: "请所有同学先尽快进行成长数据库的录入｜系统将于2026年9月21日截止，之后本人不能新增成果或进行修改，未录入的成果不能评奖使用。" },
      { id: 'l47', title: "医院：3 点去校医院皮肤科看皮肤疣", status: 'todo', date: '2026-09-16', createdAt: '2026-09-15', url: "", note: "确诊 HPV 引起的皮肤疣——已用激光治疗" },
      { id: 'l32', title: "猫猫：给 1931 商量周边", status: 'todo', date: '2026-09-09', createdAt: '2026-09-01', url: "", note: "增加价格“账目公示”板块，分析他的多维表格" },
      { id: 'l42', title: "和梓健哥他们聚一聚——田、董、赵、郑、陆、张、我、马、吴", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "下周六（9 月 12 日）和他们约着聚一聚，郑炟、董传天、田均恺、陆才、梓健哥、马钰程、赵钰彬、韩耀文" },
      { id: 'l43', title: "猪窝：日程和财务", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "把每日追踪、支出记录（攒钱计划、定期支出）、会员订阅看能否集成到一块" },
      { id: 'l1', title: "相册：给宝宝做", status: 'todo', date: '2026-07-19', createdAt: '2026-07-19', url: "", note: "" },
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
      { id: 'c25', title: "校招会：腾讯南校区宣讲会", status: 'todo', date: '2026-09-15', createdAt: '2026-09-15', url: "", note: "19-21：00 ｜B101 报告厅" },
      { id: 'c24', title: "猫猫：完善猫猫网站", status: 'todo', date: '2026-09-10', createdAt: '2026-09-10', url: "", note: "财务集成价格参考-账目公示｜行动甘特图（绝育、疫苗、救助）｜猫猫编年史变成猪窝日程那样子｜猫猫知识增加分页逻辑等，引向公众号那边｜猫猫赞助可以尝试用 CRM 管理" },
      { id: 'l41', title: "熊窝：CRM 初发搭建，视觉及逻辑建立，未完善数据字段", status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: "", note: "" },
      { id: 'c10', title: "聊天站：基础功能搭建｜4328 和 4331 的网关调试", status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: "https://www.bilibili.com/video/BV11mNA6vEJX", note: "顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的" },
      { id: 'c23', title: "小米内测申请", status: 'todo', date: '2026-09-10', createdAt: '2026-09-09', url: "https://mimo.xiaomimimo.com/desktop/invite/apply/", note: "UID 为：2419851359" },
      { id: 'c11', title: "开发笔记，常识笔记：整理笔记内容，缩减非必要笔记，重构分类学", status: 'todo', date: '2026-09-04', createdAt: '2026-09-03', url: "", note: "1. 开发笔记：典型案例改为实现流程、SOP\n2. 常识笔记：领域大调整，按经济行业和非经济行业来分" },
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
