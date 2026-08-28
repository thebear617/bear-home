export interface TodoItem {
  id: string;
  title: string;
  url?: string;
  status: 'todo' | 'doing' | 'done';
  note?: string;
  createdAt?: string;
  date?: string;
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
      { id: 'l1', title: '给宝宝做相册（0/80页）', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l8', title: '带赫兹去博辰复诊', status: 'todo', date: '2026-09-02', createdAt: '2026-08-02', url: '', note: '赫兹口炎治疗（441）后续' },
      { id: 'l31', title: '阿里的 qoder 免费领 800 次千问 3.8 max 调用', status: 'todo', date: '2026-09-03', createdAt: '2026-09-01', url: '', note: '9/3 可免费领，记得选 qoder cn' },
      { id: 'l35', title: 'MiniMax 的 2000 积分到期', status: 'todo', date: '2026-11-11', createdAt: '2026-08-12', url: '', note: '到期前用掉，别浪费' },
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c10', title: '复现 chatnotes', status: 'todo', date: '2026-08-22', createdAt: '2026-08-08', url: 'https://www.bilibili.com/video/BV11mNA6vEJX', note: '顺序学习的时候， 一颗节点树（N 个节点=N 个卡片画布），逆序总结收敛的时候，一篇markdown（N 个悬浮窗=经过内容总结后的 N 个节点）-无限画布去做节点树，就是可以自己任意拖拽组织的（这个能实现吗，感觉聊天对话里不能实现，但每个对话总结好以后就能实现了）' },
      { id: 'c19', title: '参考 B 站视频优化自己的看板视图', status: 'todo', date: '2026-08-22', createdAt: '2026-08-18', url: 'https://www.bilibili.com/video/BV1F2Mw6FExo', note: '' },
      { id: 'c21', title: '猫猫笔记升级及后台升级', status: 'todo', date: '2026-08-25', createdAt: '2026-08-23', url: '', note: '' },
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  }
];
