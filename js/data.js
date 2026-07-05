const recordLabel = '任务数';

const manualRecords = {
};

const routeCategories = [
  {
    title: '🏠 个人站点',
    items: [
      { name: '猫猫手册', desc: '猫协档案与疫苗绝育追踪', url: 'https://thebear617.github.io/cat-knowledge/' },
      { name: '猪窝', desc: '家居生活管理与美食记录', url: 'https://thebear617.github.io/pig-home/' },
      { name: '租房对账表', desc: '租房看房清单', url: 'https://thebear617.github.io/rental-checklist/' },
      { name: '表征学习图谱', desc: '表征学习知识体系', url: 'https://thebear617.github.io/representation-learning/' },
    ]
  },
  {
    title: '💻 代码仓库',
    items: [
      { name: 'htmls', desc: '所有个人站点源码合集', path: '~/Documents/htmls' },
    ]
  },
  {
    title: '📝 笔记与文档',
    items: [
      { name: 'Obsidian Vault', desc: '知识库与笔记', path: '~/Documents/notes' },
    ]
  },
];

const cookbookEntries = [
  {
    id: 'deploy-vercel',
    title: '从域名到上线：腾讯云 + GitHub + Vercel 部署全流程',
    tags: ['部署', '域名', 'Vercel'],
    body: `## 步骤

1. 在腾讯云购买域名 thebear617.cn，记得勾选禁止转移锁，完成实名认证
2. 在 GitHub 创建想要部署的仓库，push代码
3. 在 Vercel 上Import对应代码仓库，然后创建 Pproject，直接部署
4. 在 Vercel 项目 Settings → Domains 添加 www.thebear617.cn 和 thebear617.cn
5. 在腾讯云 DNS 添加 A 记录 和 CNAME 记录，按照Vercel 给的配即可，等待 Vercel 验证通过，自动签发 SSL，域名上线

## 参考

- [CSDN · 2026最新 Vercel 自动化部署与自定义域名配置教程](https://blog.csdn.net/qq_57376018/article/details/160097635)
`,
  },
];
