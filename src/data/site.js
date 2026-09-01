export const routeCategories = [
  {
    id: 'personal',
    title: '个人站点',
    icon: '🏠',
    items: [
      { name: '猫猫', desc: '猫协档案与疫苗绝育追踪', url: 'https://cat.xdubear.cn/', tags: ['宠物', '管理'], addedAt: '2026-07-20', icon: '/assets/routes/猫猫手册.png' },
      { name: '租房对账表', desc: '租房看房清单', url: 'http://rent.thebear617.cn/', tags: ['生活', '工具'], addedAt: '2026-07-22', icon: '/assets/routes/猪窝.png' },
      { name: '猪窝', desc: '个人家庭管理工具', url: 'https://pig.thebear617.cn/', tags: ['生活', '管理'], addedAt: '2026-07-31', icon: '/assets/routes/租房对账表.png' },
      { name: '科研笔记总站', desc: '按研究板块组织的科研笔记', url: 'https://rea.thebear617.cn/', tags: ['科研', '笔记'], addedAt: '2026-07-31', icon: '/assets/routes/科研笔记.png' },
      { name: '开发笔记', desc: '开发知识库', url: 'https://dev.thebear617.cn/', tags: ['开发', '笔记'], addedAt: '2026-07-31', icon: '/assets/routes/开发笔记.png' },
      { name: '常识笔记', desc: '个人常识资料库', url: 'https://life.thebear617.cn/', tags: ['生活', '笔记'], addedAt: '2026-07-31', icon: '/assets/routes/常识笔记.png' },
    ]
  },
  {
    id: 'ai',
    title: 'AI 工具',
    icon: '🤖',
    items: [
      { name: 'Claude', desc: 'Anthropic 的 AI 助手', url: 'https://claude.ai', tags: ['AI', '效率'], addedAt: '2026-07-25', icon: '/assets/routes/Claude.png' },
      { name: 'ChatGPT', desc: 'OpenAI 的对话式 AI', url: 'https://chat.openai.com', tags: ['AI', '效率'], addedAt: '2026-07-25', icon: '/assets/routes/ChatGPT.png' },
      { name: '豆包', desc: '字节的 AI 助手', url: 'https://www.doubao.com', tags: ['AI', '效率'], addedAt: '2026-07-26', icon: '/assets/routes/豆包.png' },
      { name: 'Gemini', desc: 'Google 的 AI 助手', url: 'https://gemini.google.com', tags: ['AI', '效率'], addedAt: '2026-07-26', icon: '/assets/routes/Gemini.png' },
    ]
  },
  {
    id: 'links',
    title: '常用链接',
    icon: '🔗',
    items: [
      { name: '链动小铺 1', desc: '买 ChatGPT / Claude 订阅，比官方便宜', url: 'https://dev.thebear617.cn/knowledge/development-resource-collection/', tags: ['AI', '订阅'], addedAt: '2026-08-02', icon: '/assets/routes/链动小铺.png' },
      { name: 'Hero SMS 接码平台', desc: '接码平台，ChatGPT 电话验证登录时收验证码用', url: 'https://hero-sms.com/cn', tags: ['工具', '验证'], addedAt: '2026-07-16', icon: '/assets/routes/HeroSMS.png' },
      { name: 'OpenTheRank', desc: '查全球各家大模型官方订阅在各地区的价格', url: 'https://opentherank.com/zh/', tags: ['AI', '价格'], addedAt: '2026-07-17', icon: '/assets/routes/OpenTheRank.png' },
      { name: 'OpenRouter Rankings', desc: '看全球所有大模型的实时用量 + 实时性能排行', url: 'https://openrouter.ai/rankings', tags: ['AI', '排行'], addedAt: '2026-07-17', icon: '/assets/routes/OpenRouter.png' },
      { name: 'Codex Resets', desc: '追踪 OpenAI Codex 额度重置公告，上次重置时间与历史记录', url: 'https://codex-resets.com/', tags: ['AI', '状态'], addedAt: '2026-08-09', icon: '/assets/routes/CodexResets.png' },
      { name: '鲜枣课堂', desc: '大量优质领域科普 PPT，可直接在线浏览', url: 'http://www.xzclass.com/?page_id=1', tags: ['学习', '科普'], addedAt: '2026-07-18', icon: '/assets/routes/鲜枣课堂.png' },
      { name: 'JavaGuide', desc: 'GitHub 156K+ Star 的 Java 面试与后端知识体系', url: 'https://javaguide.cn/', tags: ['学习', '开发'], addedAt: '2026-07-18', icon: '/assets/routes/JavaGuide.png' },
    ]
  },
  {
    id: 'campus',
    title: '校园服务',
    icon: '🎓',
    items: [
      { name: 'QQ 邮箱', desc: 'QQ 邮箱官方登录入口', url: 'https://mail.qq.com/', tags: ['邮箱', '常用'], addedAt: '2026-07-29', icon: '/assets/routes/QQ邮箱.png' },
      { name: '西电学生邮箱', desc: '西安电子科技大学学生邮箱登录入口', url: 'https://mail.stu.xidian.edu.cn/coremail/index.jsp?nodetect=true', tags: ['校园', '邮箱'], addedAt: '2026-07-29', icon: '/assets/routes/西电学生邮箱.png' },
      { name: '西电智课平台', desc: '西安电子科技大学智课平台', url: 'https://xdspoc.xidian.edu.cn/', tags: ['校园', '课程'], addedAt: '2026-07-29', icon: '/assets/routes/西电智课平台.png' },
      { name: '西电信息网络技术中心', desc: '西电信息网络技术中心官网,网络问题可在该网站查找', url: 'https://xxzx.xidian.edu.cn/', tags: ['校园', '网络'], addedAt: '2026-07-30', icon: '/assets/routes/西电信息网络技术中心.png' },
      { name: '西电研究生系统', desc: '西安电子科技大学研究生信息管理系统（培养/选课/成绩/导师互选）', url: 'https://yjspt.xidian.edu.cn/', tags: ['校园', '研究生'], addedAt: '2026-09-01', icon: '/assets/routes/西电研究生系统.png' },
      { name: '阿里云学生服务中心', desc: '阿里云高校学生权益中心，学生专享云资源与优惠；现在有 300 元代金券，于 26 年 8 月 19 日领取，效期截止 27 年 8 月 19 日', url: 'https://university.aliyun.com/buycenter/', tags: ['校园', '云'], addedAt: '2026-08-19', icon: '/assets/routes/阿里云.png' },
    ]
  },
  {
    id: 'research',
    title: '科研学习',
    icon: '🔬',
    items: [
      { name: 'AI Paper Notes', desc: 'AI 顶会论文中文速读速查，23000+ 篇覆盖 12 会议 55 领域', url: 'https://papernotes.org/', tags: ['科研', '论文'], addedAt: '2026-08-27', icon: '/assets/routes/PaperNotes.png' },
      { name: '考研单词2026', desc: 'B 站考研最全分类单词 2026 版，没事看两眼复习', url: 'https://www.bilibili.com/video/BV1Ng396xEZK/', tags: ['学习', '单词'], addedAt: '2026-09-01', icon: '/assets/routes/英语单词本.png' },
    ]
  },
  {
    id: 'entertainment',
    title: '购物娱乐',
    icon: '🛍️',
    items: [
      { name: 'Bilibili', desc: 'B 站 - 国内最大的弹幕视频网站', url: 'https://www.bilibili.com/', tags: ['视频', '娱乐'], addedAt: '2026-07-30', icon: '/assets/routes/Bilibili.png' },
      { name: '学习白噪音', desc: 'B 站学习白噪音视频，专注时播放', url: 'https://www.bilibili.com/video/BV1SLgY6qELc/', tags: ['学习', '专注'], addedAt: '2026-08-20', icon: '/assets/routes/Bilibili.png' },
      { name: '京东', desc: '京东商城，综合电商购物平台', url: 'https://www.jd.com/', tags: ['购物', '电商'], addedAt: '2026-08-08', icon: '/assets/routes/京东.png' },
    ]
  },
  {
    id: 'local',
    title: '本地文件',
    icon: '📂',
    items: [
      { name: 'htmls', desc: '所有个人站点源码合集', path: '~/Documents/htmls', tags: ['开发', '源码'], addedAt: '2026-07-20' },
      { name: 'Obsidian Vault', desc: '知识库与笔记', path: '~/Documents/notes', tags: ['笔记', '知识'], addedAt: '2026-07-20' },
    ]
  }
];
