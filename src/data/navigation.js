const navigationItems = [
  { id: 'home', title: '首页', icon: '⌂', sidebarIcon: '⌂', path: 'home/' },
  { id: 'routes', title: '路由表', icon: '⌘', sidebarIcon: '🗺️', path: 'routes/' },
  { id: 'dashboard', title: '生活仪表盘', icon: '◒', sidebarIcon: '🏠', path: 'dashboard/' },
  { id: 'todo-board', title: '任务看板', icon: '☑', sidebarIcon: '📋', path: 'todo-board/' },
];

export function getNavigationItems(rootHref = './') {
  return navigationItems.map((item) => ({ ...item, href: `${rootHref}${item.path}` }));
}
