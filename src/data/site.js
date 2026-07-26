export const routeCategories = [
  {
    title: '🏠 个人站点',
    items: [
      { name: '猪窝', desc: '家居生活管理与美食记录', url: 'https://pig.thebear617.cn/' },
      { name: '猫猫', desc: '猫协档案与疫苗绝育追踪', url: 'https://cat.thebear617.cn/' },
      { name: '熊窝（个人主页）', desc: '个人主页、日历追踪与支出记录', url: 'https://me.thebear617.cn/' },
      { name: '科研笔记', desc: '个人科研笔记总站', url: 'http://rea.thebear617.cn/' },
      { name: '开发笔记', desc: '个人开发知识库', url: 'https://dev.thebear617.cn/' },
      { name: '常识笔记', desc: '个人多领域常识知识站', url: 'https://life.thebear617.cn/' },
      { name: '租房对账表', desc: '租房看房清单', url: 'http://rent.thebear617.cn/' },
    ]
  },
  {
    title: '🔗 常用链接',
    items: [
      { name: 'LDXP 神秘小铺', desc: '买 ChatGPT / Claude 订阅，比官方便宜', url: 'https://pay.ldxp.cn/shop/T37M9N2N/' },
      { name: 'Hero SMS 接码平台', desc: '接码平台，ChatGPT 电话验证登录时收验证码用', url: 'https://hero-sms.com/cn' },
      { name: 'OpenTheRank', desc: '查全球各家大模型官方订阅在各地区的价格', url: 'https://opentherank.com/zh/' },
      { name: 'OpenRouter Rankings', desc: '看全球所有大模型的实时用量 + 实时性能排行', url: 'https://openrouter.ai/rankings' },
      { name: '鲜枣课堂', desc: '大量优质领域科普 PPT，可直接在线浏览', url: 'http://www.xzclass.com/?page_id=2390' },
      { name: 'JavaGuide', desc: 'GitHub 156K+ Star 的 Java 面试与后端知识体系：计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发', url: 'https://javaguide.cn/' },
    ]
  },
  {
    title: '📂 本地文件',
    items: [
      { name: 'htmls', desc: '所有个人站点源码合集', path: '~/Documents/htmls' },
      { name: 'Obsidian Vault', desc: '知识库与笔记', path: '~/Documents/notes' },
    ]
  }
];

export const membershipRecords = [
  // ===== 已过期（10 条，到期 < 2026-07-08）=====
  { name: 'monica',                    expireDate: '2026-03-10', price: 865.42, cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'ksqnm',                     expireDate: '2025-02-18', price: null,    cycleMonths: 12, tags: ['其他'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'wpsai会员',                 expireDate: '2025-05-07', price: null,    cycleMonths: 12, tags: ['工具'], note: '学生认证送了三个月', source: 'Notion 会员表', url: '' },
  { name: 'wink',                      expireDate: '2026-02-02', price: 138,    cycleMonths: 12, tags: ['工具'], note: '平时18一个月，优惠78元', source: 'Notion 会员表', url: '' },
  { name: 'csdn',                      expireDate: '2026-05-07', price: 214.76, cycleMonths: 12, tags: ['工具'], note: '新春优惠70元，并送3个月', source: 'Notion 会员表', url: '' },
  { name: 'ChatGPT Plus 会员 1',       expireDate: '2026-06-07', price: 29,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: 'claude 原版',               expireDate: '2026-06-15', price: 88,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: 'ChatGPT Plus 会员 2',       expireDate: '2026-06-20', price: 29,     cycleMonths: 1,  tags: ['AI'],   note: '', source: '手动新增',     url: '' },
  { name: '爱奇艺',                    expireDate: '2026-02-14', price: 138,    cycleMonths: 12, tags: ['视频'], note: '平时25一个月，优惠了162', source: 'Notion 会员表', url: '' },
  { name: '一生足迹',                  expireDate: '2025-11-12', price: null,    cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },

  // ===== 未过期（20 条，到期 >= 2026-07-08 或空）=====
  { name: 'OpenCode Go 1',             expireDate: '2026-07-17', price: 35,     cycleMonths: 1,  tags: ['AI'], note: '这个是用 1357953389 的 GitHub 登录的', source: '手动新增', url: 'https://opencode.ai/go' },
  { name: 'OpenCode Go 2',             expireDate: '2026-07-30', price: 35,     cycleMonths: 1,  tags: ['AI'], note: '用耿梦🫎的谷歌账号登录', source: '手动新增', url: 'https://opencode.ai/go' },
  { name: 'minimax-m3-plus',           expireDate: '2026-08-01', price: 49,     cycleMonths: 1,  tags: ['AI'], note: '', source: '手动新增', url: '' },
  { name: 'ChatGPT Plus',              expireDate: '2026-08-12', price: 25,     cycleMonths: 1,  tags: ['AI'], note: '登录账号为 erbaysalim0387@gmail.com', source: '手动新增', url: '' },
  { name: '88vip➕网易云➕优酷年会员',  expireDate: '2026-09-30', price: null,   cycleMonths: 12, tags: ['购物'], note: '', source: 'Notion 会员表', url: '' },
  { name: '百度云',                    expireDate: '2026-09-13', price: 158,    cycleMonths: 12, tags: ['网盘'], note: '学生优惠158一年', source: 'Notion 会员表', url: 'https://pan.baidu.com/comps/view/MV8xMDg5XzEzNDlfMzgyN19vbmxpbmU=/1780909596893?&activity_id=963521758612&shareType=link' },
  { name: 'wps超级会员',               expireDate: '2026-11-30', price: 79,     cycleMonths: 12, tags: ['工具'], note: '2年158元，折合79/年（比88学生单年更划算）', source: 'Notion 会员表', url: 'https://personal-act.wps.cn/rubik2/portal/HD2025062313463058/YM2025111816522242?cs_from=pc_paywin_icon_mkt_dbwrz&mk_key=P0iFpm4eH6tvMNOT9vs3k34LlqRX7gbU1wypg6Ea&position=pc_paywin_icon_mkt_dbwrz&tab=stu&active-nav-key=stu_area' },
  { name: '爱奇艺体育会员（非爱足球）', expireDate: '2027-01-12', price: null,   cycleMonths: 24, tags: ['视频'], note: '买两年迅雷会员送的', source: 'Notion 会员表', url: '' },
  { name: '京东plus',                  expireDate: '2027-02-05', price: 49.5,   cycleMonths: 24, tags: ['购物'], note: '只要 618 左右去买这个京东的双年卡就可以了，应该需要在京东 PLUS 失效的前提下去买。', source: 'Notion 会员表', url: '' },
  { name: '网易云音乐',                expireDate: '2027-02-17', price: 108,    cycleMonths: 12, tags: ['音乐'], note: '平时45一季，一年180，优惠72；学生优惠（22岁以下）60一年\n88vip送344天 2025.10.22 领取', source: 'Notion 会员表', url: '' },
  { name: '梯子',                      expireDate: '2027-05-03', price: 147.6,  cycleMonths: 12, tags: ['其他'], note: '', source: 'Notion 会员表', url: '' },
  { name: '鲨鱼记账',                  expireDate: '2027-05-04', price: null,   cycleMonths: 12, tags: ['工具'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'b站',                       expireDate: '2027-12-30', price: null,   cycleMonths: 12, tags: ['视频'], note: '', source: 'Notion 会员表', url: '' },
  { name: '迅雷',                      expireDate: '2028-05-22', price: 164,    cycleMonths: 12, tags: ['网盘'], note: '', source: 'Notion 会员表', url: '' },
  { name: 'microsoft 365',             expireDate: '',           price: 239,    cycleMonths: 12, tags: ['工具'], note: '平时每个月38块，一年456，直接省两百多', source: 'Notion 会员表', url: '' },
  { name: 'qq音乐',                    expireDate: '',           price: 108,    cycleMonths: 12, tags: ['音乐'], note: '平时45一季，一年180，优惠72｜财富自由再开通', source: 'Notion 会员表', url: '' },
  { name: '剪映',                      expireDate: '',           price: 298,    cycleMonths: 12, tags: ['工具'], note: '无效优惠，平时也是一个月25，就优惠了两块', source: 'Notion 会员表', url: '' },
  { name: '夸克（两年）',              expireDate: '',           price: 208,    cycleMonths: 24, tags: ['网盘'], note: '平时新开的话9块一个月，看剧时充一下就行', source: 'Notion 会员表', url: '' },
  { name: '夸克➕优酷（电视端）➕88vip➕网易云➕饿了么年卡', expireDate: '', price: 160, cycleMonths: 12, tags: ['购物'], note: '', source: 'Notion 会员表', url: '' },
  { name: '全民k歌',                   expireDate: '',           price: 168,    cycleMonths: 12, tags: ['音乐'], note: '平时有些时候开一个月才6元，想开再用', source: 'Notion 会员表', url: '' },
  { name: '腾讯+京东',                 expireDate: '',           price: 198,    cycleMonths: 12, tags: ['购物'], note: '心动但确实没必要，等以后可以赚钱了再说，不然一年得买17笔运费才够开通费的', source: 'Notion 会员表', url: '' },
];
