// 特工映射：官方中文名 -> { role, roleEn, tone, icon }
// 由 valorant-api.com v1/agents?language=zh-CN 导出，头像已本地化到 ../assets/valorant/agents/
var valorantAgents = {
  "盖可": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/盖可.png"
  },
  "黑梦": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/黑梦.png"
  },
  "铁臂": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/铁臂.png"
  },
  "钢锁": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/钢锁.png"
  },
  "钛狐": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/钛狐.png"
  },
  "雷兹": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/雷兹.png"
  },
  "尚勃勒": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/尚勃勒.png"
  },
  "K/O": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/K_O.png"
  },
  "斯凯": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/斯凯.png"
  },
  "零": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/零.png"
  },
  "猎枭": {
    "role": "先锋",
    "roleEn": "initiator",
    "tone": "blue",
    "icon": "../assets/valorant/agents/猎枭.png"
  },
  "迷核": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/迷核.png"
  },
  "奇乐": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/奇乐.png"
  },
  "海神": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/海神.png"
  },
  "维斯": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/维斯.png"
  },
  "蝰蛇": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/蝰蛇.png"
  },
  "不死鸟": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/不死鸟.png"
  },
  "禁灭": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/禁灭.png"
  },
  "星礈": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/星礈.png"
  },
  "炼狱": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/炼狱.png"
  },
  "壹决": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/壹决.png"
  },
  "暮蝶": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/暮蝶.png"
  },
  "霓虹": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/霓虹.png"
  },
  "夜露": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/夜露.png"
  },
  "幻棱": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/幻棱.png"
  },
  "贤者": {
    "role": "哨卫",
    "roleEn": "sentinel",
    "tone": "green",
    "icon": "../assets/valorant/agents/贤者.png"
  },
  "芮娜": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/芮娜.png"
  },
  "幽影": {
    "role": "控场",
    "roleEn": "controller",
    "tone": "purple",
    "icon": "../assets/valorant/agents/幽影.png"
  },
  "捷风": {
    "role": "决斗",
    "roleEn": "duelist",
    "tone": "red",
    "icon": "../assets/valorant/agents/捷风.png"
  }
};

// 别名表：俗称/旧译名 -> 官方中文名（解析 callout 内 "推荐阵容" 时使用）
var valorantAgentAlias = {
  "瑞娜": "芮娜",
  "亚星卓": "星礈",
  "保安": "零",
  "KO": "K/O",
  "火男": "不死鸟",
  "叛奇": "奇乐",
  "太后": "迷核",
  "燕来": "海神",
  "铁壁": "铁臂",
  "太湖": "迷核",
  "幻影": "捷风"
};
