// 「想做清单」——无期限、无状态的轻清单。
// 跟 todo-data.ts（有排期、有状态机、有归档的任务看板）刻意区分：
// 这里不排期、不设截止、不追踪进度，想起来就做，做完了直接删。
export interface WantItem {
  text: string;
  tag?: string;
  added?: string;
}

export const WANT_ITEMS: WantItem[] = [
  { text: '去川湘小炒吃千叶豆腐炒腊肉', tag: '吃', added: '2026-09-19' }
];
