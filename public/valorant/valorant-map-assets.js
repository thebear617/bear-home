/*
 * 地图原图资源表。
 * 图片来自 VALORANT API /v1/maps?language=zh-CN 的 displayIcon，
 * 已在发布前缓存到本站，运行时不依赖或热链第三方 API。
 */
var valorantMapAssets = {
  source: {
    provider: 'VALORANT API',
    mapsEndpoint: 'https://valorant-api.com/v1/maps?language=zh-CN',
    policy: 'cache-locally-before-release'
  },
  maps: {
    '亚海悬城': { src: '../assets/valorant/tactical-maps/ascent.png', alt: '亚海悬城原始俯视地图' },
    '霓虹町': { src: '../assets/valorant/tactical-maps/split.png', alt: '霓虹町原始俯视地图' },
    '深海明珠': { src: '../assets/valorant/tactical-maps/pearl.png', alt: '深海明珠原始俯视地图' },
    '莲华古城': { src: '../assets/valorant/tactical-maps/lotus.png', alt: '莲华古城原始俯视地图' },
    '隐世修所': { src: '../assets/valorant/tactical-maps/haven.png', alt: '隐世修所原始俯视地图' },
    '源工重镇': { src: '../assets/valorant/tactical-maps/bind.png', alt: '源工重镇原始俯视地图' },
    '盐海矿镇': { src: '../assets/valorant/tactical-maps/corrode.png', alt: '盐海矿镇原始俯视地图' },
    '天枢云阙': { src: '../assets/valorant/tactical-maps/summit.png', alt: '天枢云阙原始俯视地图' },
    '日落之城': { src: '../assets/valorant/tactical-maps/sunset.png', alt: '日落之城原始俯视地图' },
    '微风岛屿': { src: '../assets/valorant/tactical-maps/breeze.png', alt: '微风岛屿原始俯视地图' },
    '森寒冬港': { src: '../assets/valorant/tactical-maps/icebox.png', alt: '森寒冬港原始俯视地图' },
    '裂变峡谷': { src: '../assets/valorant/tactical-maps/fracture.png', alt: '裂变峡谷原始俯视地图' },
    '幽邃地窟': { src: '../assets/valorant/tactical-maps/abyss.png', alt: '幽邃地窟原始俯视地图' }
  }
};
