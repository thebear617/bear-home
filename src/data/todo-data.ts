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
      { id: 'l1', title: '给宝宝做相册（0/80页）', status: 'todo', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l8', title: '带赫兹去博辰复诊，明天商量月饼选择', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l31', title: '阿里的 qoder 免费领 2000 次千问 3.8 max 调用', status: 'todo', date: '2026-09-03', createdAt: '2026-09-01', url: 'https://qoder.com.cn/referral?spm=5176.28644950.0.0.30d079bbM3C7y1', note: '9/3 前开通可以有 2000 次调用' },
      { id: 'l32', title: '和 1931 商量猫猫周边', status: 'todo', date: '2026-09-08', createdAt: '2026-09-01', url: '', note: '在图书馆阅悦咖啡商量猫猫设计' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c10', title: '复现 chatnotes', status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: '顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的（这个能实现吗，感觉聊天对话里不能实现，但每个对话总结好以后就能实现了）' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
