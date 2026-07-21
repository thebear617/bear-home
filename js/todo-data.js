// js/todo-data.js
// 任务看板数据层。TodoBoard 组件从这里读取 TODO_BOARDS。
// 字段约定见 docs/superpowers/specs/2026-07-18-personal-todo-board-design.md 第 4 节。
//
// 初始数据迁移（2026-07-18）：从 ~/.hermes/reminder-today.md「待转录视频」一节迁入。
// 详见 spec 第 12 节。
const TODO_BOARDS = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: [
      { id: 'v1', title: '世界模型：在 AI 里抛硬币，概率是 50% 吗？', url: 'https://b23.tv/1RotOy9', status: 'todo', note: '预计归 lifenotes/AI产业', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v2', title: '中科院研究生如何用 AI 把 idea 一步步变成论文', url: 'https://www.bilibili.com/video/BV1LKjS6gEh4/', status: 'todo', note: '预计归 reanotes/literature', createdAt: '2026-07-18', date: '2026-07-18' },
      { id: 'v3', title: 'GPT-5.6 + image2 三步法输出高质量学术 PPT', url: 'https://www.bilibili.com/video/BV1mgNj6MEuX/', status: 'todo', note: '预计归 reanotes/dlproject', createdAt: '2026-07-18', date: '2026-07-18' }
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r1', title: '做好端到端的 pdf2html 的 skill', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' }
    ]
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c1', title: '看别人简历上的项目进行复现', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l1', title: '给宝宝做相册', status: 'doing', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l2', title: '小猫赫兹-博辰看牙', status: 'todo', date: '2026-07-19', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l3', title: '约会安排', status: 'done', date: '2026-07-20', createdAt: '2026-07-20', url: '', note: '' }
    ]
  }
];