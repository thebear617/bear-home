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
      { id: 'l32', title: "猫猫：给 1931 商量周边", status: 'todo', date: '2026-09-09', createdAt: '2026-09-01', url: "", note: "在图书馆阅悦咖啡商量猫猫设计-周三下午三点" },
      { id: 'l46', title: "研究生选课", status: 'todo', date: '2026-09-08', createdAt: '2026-09-05', url: "https://gr.xidian.edu.cn/info/1037/20494.htm", note: "指定计划：9月8日9:00至9月18日17:00；选课：9月8日14:00至9月18日17:00。" },
      { id: 'l45', title: "猪窝：美食记录升级", status: 'todo', date: '2026-09-08', createdAt: '2026-09-05', url: "", note: "集成做菜记录➕菜谱➕食材存放甘特图➕价格图" },
      { id: 'l44', title: "购买一个 在家喝的500ml的水瓶", status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: "https://item.jd.com/100135363038.html?pcdk=stPamDq6YyH3dOCYnsmj539riQCTQKktAH1iqhinti2pPavR2ev4votaoc0caxqi.rQ4a.tlbT&spmTag=YTAyMTkuYjAwMjM1Ni5jMDAwMDcyMTAua2V5d29yZF9lbnRlciU0MDE3ODg1MDkzNzczNTYlMjMxNzgwOTAzMzUyNzI3OTM0MzgwMTk0JTIzMTM1MzYzMDAzMiUyQ2EwMjQwLmIwMDI0OTMuYzAwMDA0MDI3LjIlMjNza3VfY2FyZCU0MDE3ODg1MTAyNzUzNDclMjMxNzgwOTAzMzUyNzI3OTM0MzgwMTk0JTIzNzkzMDU0NjI2", note: "500mL 水瓶 透明 宽口 耐热 密封｜已找到，价格为 14.31，还需要一个防尘盖" },
      { id: 'l8', title: "带赫兹去博辰复诊，顺便回学校收拾东西", status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: "", note: "赫兹口炎治疗（441）后续" },
      { id: 'l43', title: "猪窝：支出记录升级", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "把攒钱计划、定期支出、会员订阅看能否集成到一块" },
      { id: 'l42', title: "和梓健哥他们聚一聚", status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: "", note: "下周六（9 月 12 日）和他们约着聚一聚，郑炟、董传天、田均恺、陆才、梓健哥、马钰程、赵钰彬、韩耀文" },
      { id: 'l1', title: "给宝宝做相册", status: 'todo', date: '2026-07-19', createdAt: '2026-07-19', url: "", note: "" },
      { id: 'l39', title: "商量月饼选择", status: 'todo', date: '2026-09-02', createdAt: '2026-09-02', url: "", note: "和宝宝老妈商量今年中秋送什么月饼" },
      { id: 'l40', title: '更新一下攒钱计划，把美团的钱还上', status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: '', note: '' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c11', title: "开发笔记，常识笔记：整理笔记内容，缩减非必要笔记，重构分类学", status: 'todo', date: '2026-09-04', createdAt: '2026-09-03', url: "", note: "1. 开发笔记：典型案例改为实现流程、SOP\n2. 常识笔记：领域大调整，按经济行业和非经济行业来分" },
      { id: 'l41', title: "熊窝：CRM 搭建", status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: "", note: "" },
      { id: 'c10', title: '复现 chatnotes', status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: '顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的（这个能实现吗，感觉聊天对话里不能实现，但每个对话总结好以后就能实现了）' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r6', title: "组内：完成个人情况和调研情况的 PPT", status: 'todo', date: '2026-09-06', createdAt: '2026-09-06', url: "", note: "" },
      { id: 'r5', title: "大组会工作总结准备", status: 'todo', date: '2026-09-06', createdAt: '2026-09-03', url: "", note: "周日早上九点：学期工作总结和计划汇报" },
    ]
  }
];
