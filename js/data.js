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
    source: 'https://blog.csdn.net/qq_57376018/article/details/160097635',
    sourceName: 'CSDN · 2026最新 Vercel 自动化部署与自定义域名配置教程',
    steps: [
      { done: true, text: '在腾讯云购买域名 thebear617.cn，完成实名认证' },
      { done: true, text: '在 GitHub 创建仓库 bear-home，提交静态网站代码' },
      { done: true, text: '尝试 GitHub Pages 绑定自定义域名，CNAME 指向 thebear617.github.io → 404，放弃' },
      { done: true, text: '（坑）Vercel 授权：Vercel 看不到仓库 → GitHub Settings → Applications → Vercel → 勾选 bear-home' },
      { done: true, text: '在 Vercel Import bear-home，Framework Preset 选 Other，无构建命令，部署成功' },
      { done: true, text: '在 Vercel 项目 Settings → Domains 添加 www.thebear617.cn 和 thebear617.cn' },
      { done: true, text: '（坑）Vercel 给的 CNAME 是项目专属地址（非固定 cname.vercel-dns.com），以页面实际显示为准' },
      { done: true, text: '在腾讯云 DNS 添加 CNAME 记录，主机 www → Vercel 给的地址，同理配 @' },
      { done: true, text: '等待 Vercel 验证通过，自动签发 SSL，域名上线' },
    ],
    note: '纯静态 Vue 3 站点，Git push 触发 Vercel 自动部署；自定义域名一条 CNAME 即可，不需要 A 记录。'
  },
];
