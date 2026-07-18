// js/todo-data.js
// 任务看板数据层。TodoBoard 组件从这里读取 TODO_BOARDS。
// 字段约定见 docs/superpowers/specs/2026-07-18-personal-todo-board-design.md 第 4 节。
const TODO_BOARDS = [
  {
    id: 'video',
    name: '视频',
    icon: '🎬',
    items: []
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: []
  },
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: []
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: []
  }
];