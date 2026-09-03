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
      { id: 'l1', title: "给宝宝做相册", status: 'todo', date: '2026-07-19', createdAt: '2026-07-19', url: "", note: "" },
      { id: 'l39', title: "商量月饼选择", status: 'todo', date: '2026-09-02', createdAt: '2026-09-02', url: "", note: "和宝宝老妈商量今年中秋送什么月饼" },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l32', title: '和 1931 商量猫猫周边', status: 'todo', date: '2026-09-08', createdAt: '2026-09-01', url: '', note: '在图书馆阅悦咖啡商量猫猫设计' },
      { id: 'l40', title: '更新一下攒钱计划，把美团的钱还上', status: 'todo', date: '2026-09-03', createdAt: '2026-09-03', url: '', note: '' },
      { id: 'l41', title: '人际交往排期甘特图', status: 'todo', date: '2026-09-04', createdAt: '2026-09-04', url: '', note: '' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c10', title: '复现 chatnotes', status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: '顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的（这个能实现吗，感觉聊天对话里不能实现，但每个对话总结好以后就能实现了）' },
      { id: 'c11', title: '整理开发笔记的笔记，把典型案例改为实现流程、SOP，每一篇笔记瞄准一类产物', status: 'todo', date: '2026-09-04', createdAt: '2026-09-03', url: '', note: '' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
    ]
  }
];
