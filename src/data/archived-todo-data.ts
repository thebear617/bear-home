import type { TodoBoard } from './todo-data';

/**
 * 已完成任务归档 —— status: 'done' 的条目移到这里，
 * 保持 todo-data.ts 只含 todo / doing 的活跃项。
 *
 * 添加新任务时写 todo-data.ts；任务完成后可移入此文件。
 * 本文件与 todo-data.ts 类型兼容，客户端同时加载两份数据。
 */
export const ARCHIVED_TODO_BOARDS: TodoBoard[] = [
  {
    id: 'coding',
    name: '编程',
    icon: '💻',
    items: [
      { id: 'c2', title: '删除开发笔记页面的操作系统', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c3', title: '增加一个新板块，叫做"提示词工程"，专门记录当前 Agent 的一些好的使用案例和好的提示词', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'c4', title: '写一篇博客叫 Vibe Working——how to make a PPT', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', note: '产物：devnotes/src/content/prompts/lit-to-ppt.md' },
      { id: 'c5', title: 'design a site: Valorant', status: 'done', date: '2026-07-26', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c6', title: '写一篇博客叫 Vibe Working——how to make a picture', status: 'done', date: '2026-07-27', createdAt: '2026-07-26', url: '', note: '' },
      { id: 'c7', title: '依据 dash.valorant-api.com API 站点去建立无畏契约的站点', url: 'https://dash.valorant-api.com/endpoints/agents', status: 'done', date: '2026-08-02', createdAt: '2026-07-27', note: '' },
      { id: 'c9', title: '个人仪表盘-逻辑继续完善，加入番茄钟插件联动逻辑', status: 'done', date: '2026-08-07', createdAt: '2026-08-05', note: '个人仪表盘 v0.18.0 后续：番茄钟 + 仪表盘数据联动' },
      { id: 'c10', title: '进行「猪窝的美食地图」的升级 + 整理南宁美食', status: 'done', date: '2026-08-07', createdAt: '2026-08-05', note: '两件事合并：① 美食地图升级 ② 整理南宁美食' },
      { id: 'c12', title: '研究浏览器的连接器具体有哪几种', status: 'done', date: '2026-08-10', createdAt: '2026-08-08', url: '', note: '参考 devnotes「学习资源：开发资源合集」里的四款浏览器连接器对比（Cua Driver / ego / Kimi WebBridge 等）' },
      { id: 'c13', title: '猪窝加上收入的逻辑', status: 'done', date: '2026-08-17', createdAt: '2026-08-16', url: '', note: '' },
      { id: 'c14', title: '补全之前个人开发时间线的 UI（个人审美记录）', status: 'done', date: '2026-08-18', createdAt: '2026-08-16', url: '', note: 'devnotes 补全各站点历史 UI 时间线，发布 v0.15.0' },
      { id: 'c15', title: '参考 B 站视频美化自己的个人仪表盘，学习他的记笔记方式', status: 'done', date: '2026-08-28', createdAt: '2026-08-16', url: 'https://lvyovo-wiki.tech/', note: '' },
      { id: 'c22', title: '尝试 codex 原生功能与 skill：browser、computer use、product design、figma、image gen、goal 模式 for UI', status: 'done', date: '2026-08-24', createdAt: '2026-08-14', url: '', note: '8/24 完成 codex 原生功能尝试' },
      { id: 'c19', title: '参考 B 站视频优化自己的看板视图', status: 'done', date: '2026-08-22', createdAt: '2026-08-18', url: 'https://www.bilibili.com/video/BV1F2Mw6FExo', note: '看板视图优化完成（侧边栏折叠/展开交互升级）' }
    ]
  },
  {
    id: 'research',
    name: '科研',
    icon: '🔍',
    items: [
      { id: 'r1', title: '做好端到端的 pdf2html 的 skill', status: 'done', date: '2026-08-01', createdAt: '2026-07-19', url: '', note: 'pdf2blog-zh skill 开发完成；产物：reanotes v0.7.0（b248924 02:49 feat + 237baff 02:49 docs）' },
      { id: 'r2', title: '录制 IGrass 12 分钟 oral 视频', status: 'done', date: '2026-08-06', createdAt: '2026-08-05', url: '', note: '8/6 20:30-22:30 录制完成' },
      { id: 'v10', title: '这个 skill，让 AI 做出顶级审美的图表', url: 'https://www.bilibili.com/video/BV14HgY6YEMx/?share_source=copy_web&vd_source=03f4c4c1219f23af84f99d441d39f961', status: 'done', note: '来源：B站；已完成 8/7', createdAt: '2026-07-31', date: '2026-08-07' },
      { id: 'v2', title: '中科院研究生如何用 AI 把 idea 一步步变成论文', url: 'https://www.bilibili.com/video/BV1LKjS6gEh4/', status: 'done', note: '预计归 reanotes/literature；已完成 8/7', createdAt: '2026-07-18', date: '2026-08-07' },
      { id: 'v11', title: 'Cloud code 负责人的 1 小时播客，讲述他对 Vibe Coding 的看法', url: 'http://xhslink.cn/o/5mYU5BrF8KZ', status: 'done', note: '来源：小红书；已完成 8/7', createdAt: '2026-07-31', date: '2026-08-07' },
      { id: 'r4', title: '8 月 23 号下午 3 点，参加多模态组的工作汇报（大组会）', status: 'done', date: '2026-08-23', createdAt: '2026-08-20', url: '', note: '8/23 13:30-16:00 边开大组会边思考学习' }
    ]
  },
  {
    id: 'life',
    name: '生活',
    icon: '🏠',
    items: [
      { id: 'l2', title: '小猫赫兹-博辰看牙', status: 'done', date: '2026-07-24', createdAt: '2026-07-19', url: '', note: '' },
      { id: 'l3', title: '约会安排', status: 'done', date: '2026-07-20', createdAt: '2026-07-20', url: '', note: '' },
      { id: 'l4', title: '把床板搬走', status: 'done', date: '2026-07-24', createdAt: '2026-07-24', url: '', note: '' },
      { id: 'l5', title: '7 月 26 日回学校放游泳装备、拿电脑、拿身份证、收拾宿舍', status: 'done', date: '2026-07-25', createdAt: '2026-07-24', url: '', note: '提前 7/25 完成' },
      { id: 'l6', title: '带行李箱回去学校把衣服收拾好，把泳衣泳帽拿回去', status: 'done', date: '2026-07-26', createdAt: '2026-07-25', url: '', note: '' },
      { id: 'l7', title: '处理甲醛 - 把衣柜里的衣服全部拿出来晾晒冲洗', status: 'done', date: '2026-08-02', createdAt: '2026-07-31', url: '', note: '活性炭 + 晾晒冲洗全流程完成' },
      { id: 'l12', title: '让大贝果去取赫兹的猫粮', status: 'done', date: '2026-08-09', createdAt: '2026-08-06', url: '', note: '代取猫粮' },
      { id: 'l14', title: '8 月 9 号下午 3 点开大组会：Camouflage-aware Image-Text Retrieval via Expert Collaboration', status: 'done', date: '2026-08-09', createdAt: '2026-08-08', url: '', note: '下午 3 点' },
      { id: 'l10', title: '去民主路看牙', status: 'done', date: '2026-08-11', createdAt: '2026-08-05', url: '', note: '下午 13:00，补了 3 颗牙' },
      { id: 'l20', title: '逛南宁夜市·水街', status: 'done', date: '2026-08-13', createdAt: '2026-08-08', url: '', note: '水街夜市' },
      { id: 'l21', title: '逛南宁夜市·平西', status: 'done', date: '2026-08-13', createdAt: '2026-08-08', url: '', note: '平西夜市' },
      { id: 'l22', title: '逛南宁夜市·中山', status: 'done', date: '2026-08-13', createdAt: '2026-08-08', url: '', note: '中山夜市' },
      { id: 'l23', title: '逛南宁夜市·南铁', status: 'done', date: '2026-08-09', createdAt: '2026-08-08', url: '', note: '南铁夜市' },
      { id: 'l24', title: '参加27届求职面试通关指南腾讯会议', status: 'done', date: '2026-08-12', createdAt: '2026-08-12', url: '', note: '15:00 腾讯会议，会议号 216543013' },
      { id: 'l25', title: '逛南宁夜市·琅西', status: 'done', date: '2026-08-13', createdAt: '2026-08-08', url: '', note: '琅西夜市（琅西村啫啫煲一带）' },
      { id: 'l26', title: '逛南宁夜市·西关', status: 'done', date: '2026-08-14', createdAt: '2026-08-08', url: '', note: '西关夜市' },
      { id: 'l27', title: '逛南宁夜市·百货大楼', status: 'done', date: '2026-08-14', createdAt: '2026-08-08', url: '', note: '百货大楼夜市' },
      { id: 'l29', title: '下午 3 点开大组会：VGGT: Visual Geometry Grounded Transformer', status: 'done', date: '2026-08-15', createdAt: '2026-08-15', url: '', note: '下午 3 点' },
      { id: 'l30', title: '去电信营业厅办理新的电话卡', status: 'done', date: '2026-08-17', createdAt: '2026-08-16', url: '', note: '' },
      { id: 'l16', title: '继续去民主路补牙', status: 'done', date: '2026-08-19', createdAt: '2026-08-11', url: '', note: '补第 4 颗牙' },
      { id: 'l13', title: '逛南宁夜市：步行街、建政路', status: 'done', date: '2026-08-19', createdAt: '2026-08-08', url: '', note: '剩余 2 条夜市街待逛' },
      { id: 'l18', title: '走之前去平西夜市买一对穿壮族服饰的水豚噜噜、去买点泸溪河', status: 'done', date: '2026-08-23', createdAt: '2026-08-12', url: '', note: '8/23 平西夜市买壮族噜噜（70 元）+ 泸溪河面包碎（39.6 元）' },
      { id: 'l11', title: '购买不锈钢碗、大菜篮子、检查燃气热水器 CO', status: 'done', date: '2026-08-24', createdAt: '2026-08-05', url: '', note: '8/24 完成：买不锈钢碗、大菜篮子、检查燃气热水器一氧化碳' },
      { id: 'l9', title: '晾晒活性炭', status: 'done', date: '2026-08-24', createdAt: '2026-08-03', url: '', note: '甲醛处理后续：活性炭晾晒完成' },
      { id: 'l17', title: '回去和过马路一起打桌游', status: 'done', date: '2026-08-28', createdAt: '2026-08-11', url: '', note: '' },
      { id: 'l32', title: '过马路去校医院看牙齿', status: 'done', date: '2026-08-28', createdAt: '2026-08-25', url: '', note: '' },
      { id: 'l33', title: '过马路问学校的电脑多少钱', status: 'done', date: '2026-08-28', createdAt: '2026-08-25', url: '', note: '' },
      { id: 'l15', title: '研究京东 PLUS 12 积分如何使用', status: 'done', date: '2026-08-28', createdAt: '2026-08-08', url: '', note: '京东 PLUS 会员每年有 12 积分，在「我的 → PLUS 专区 → 生活服务包」可兑换家政保洁 / 洗衣洗鞋 / 洗车 / 寄快递 / 在线问诊 / 读书月卡等（保洁 5 分、洗车 3 分、洗衣洗鞋 3 分、寄件 1 分）' },
      { id: 'l34', title: '在家里买油瓶', status: 'done', date: '2026-08-28', createdAt: '2026-08-25', url: '', note: '' },
      { id: 'l36', title: '制定猪窝的 1 周菜单', status: 'done', date: '2026-08-30', createdAt: '2026-08-30', url: 'https://life.thebear617.cn/life/home-weekly-menu/', note: '8/30 完成' }
    ]
  }
];
