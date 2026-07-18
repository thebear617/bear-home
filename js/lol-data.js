var lolMageGuideData = {
  title: '海斗 3.0｜法师出装公式',
  subtitle: '法穿棒第三件，最晚第四件',
  builds: [
    {
      id: 'double-burn',
      title: '双烧流',
      tagline: '稳健 · 熟练度低也能用',
      tone: 'gold',
      rows: [
        { label: '出门', type: 'starter', items: [
          { name: '遗失章节', icon: 'assets/lol/items/3802.png' }
        ] },
        { label: '必出', type: 'core', items: [
          { name: '火炬', icon: 'assets/lol/items/2503.png' },
          { name: '面具', icon: 'assets/lol/items/6653.png' },
          { name: '法穿棒', icon: 'assets/lol/items/3135.png' },
          { name: '放血者', icon: 'assets/lol/items/4010.png' },
          { name: '吸血鞋', icon: 'assets/lol/items/3008.png' }
        ] },
        { label: '按需', type: 'optional', items: [
          { name: '重伤球', icon: 'assets/lol/items/3916.png' },
          { name: '影焰', icon: 'assets/lol/items/4645.png' },
          { name: '中娅', icon: 'assets/lol/items/3157.png' },
          { name: '冰杖', icon: 'assets/lol/items/3116.png' },
          { name: '帽子', icon: 'assets/lol/items/3089.png' },
          { name: '女妖', icon: 'assets/lol/items/3102.png' },
          { name: '兰顿', icon: 'assets/lol/items/3143.png' }
        ] },
        { label: '英雄', type: 'champion', items: [
          { name: '火男', icon: 'assets/lol/champions/Brand.png' },
          { name: '炸弹人', icon: 'assets/lol/champions/Ziggs.png' },
          { name: '蚂蚱', icon: 'assets/lol/champions/Malzahar.png' },
          { name: '彗', icon: 'assets/lol/champions/Hwei.png' },
          { name: '死歌', icon: 'assets/lol/champions/Karthus.png' }
        ] }
      ]
    },
    {
      id: 'burst',
      title: '爆炸流',
      tagline: '高风险 · 高回报',
      tone: 'red',
      rows: [
        { label: '出门', type: 'starter', items: [
          { name: '章节不合', icon: 'assets/lol/items/3108.png' }
        ] },
        { label: '必出', type: 'core', items: [
          { name: '影焰', icon: 'assets/lol/items/4645.png' },
          { name: '法穿棒', icon: 'assets/lol/items/3135.png' },
          { name: '吸血 /', icon: 'assets/lol/items/3008.png' },
          { name: '法穿鞋', icon: 'assets/lol/items/3020.png' }
        ] },
        { label: '按需', type: 'optional', items: [
          { name: '帽子', icon: 'assets/lol/items/3089.png' },
          { name: '中娅', icon: 'assets/lol/items/3157.png' },
          { name: '女妖', icon: 'assets/lol/items/3102.png' },
          { name: '兰顿', icon: 'assets/lol/items/3143.png' },
          { name: '四件后火炬', icon: 'assets/lol/items/2503.png' }
        ] },
        { label: '英雄', type: 'champion', items: [
          { name: '阿萝拉', icon: 'assets/lol/champions/Aurora.png' },
          { name: '妖姬', icon: 'assets/lol/champions/Leblanc.png' },
          { name: '辛德拉', icon: 'assets/lol/champions/Syndra.png' },
          { name: '佐伊', icon: 'assets/lol/champions/Zoe.png' },
          { name: '梅尔', icon: 'assets/lol/champions/Mel.png' }
        ] }
      ]
    },
    {
      id: 'engage',
      title: '开团流',
      tagline: '目标：打出爆炸好团',
      tone: 'blue',
      rows: [
        { label: '出门', type: 'starter', join: '+', items: [
          { name: '恶魔法典', icon: 'assets/lol/items/3108.png' },
          { name: '红水晶', icon: 'assets/lol/items/1028.png' }
        ] },
        { label: '必出', type: 'core', items: [
          { name: '推推 /', icon: 'assets/lol/items/3152.png' },
          { name: '残疫', icon: 'assets/lol/items/3118.png' },
          { name: '影焰', icon: 'assets/lol/items/4645.png' },
          { name: '法穿棒', icon: 'assets/lol/items/3135.png' },
          { name: '法穿鞋', icon: 'assets/lol/items/3020.png' },
          { name: '中娅', icon: 'assets/lol/items/3157.png' }
        ] },
        { label: '按需', type: 'optional', items: [
          { name: '重伤球', icon: 'assets/lol/items/3916.png' },
          { name: '帽子', icon: 'assets/lol/items/3089.png' }
        ] },
        { label: '英雄', type: 'champion', items: [
          { name: '安妮', icon: 'assets/lol/champions/Annie.png' },
          { name: '妮蔻', icon: 'assets/lol/champions/Neeko.png' },
          { name: '稻草人', icon: 'assets/lol/champions/Fiddlesticks.png' },
          { name: '吸血鬼', icon: 'assets/lol/champions/Vladimir.png' },
          { name: '冰女', icon: 'assets/lol/champions/Lissandra.png' }
        ] }
      ]
    }
  ],
  quickRules: [
    '缺蓝：多挂女神泪；除瑞兹外不合大天使',
    '重伤球只挂小件；卢登已被火炬全面优化',
    '不建议升级鞋子；移速重要，吸血鞋性价比高'
  ],
  special: {
    label: '瑞兹特例',
    champion: { name: '瑞兹', icon: 'assets/lol/champions/Ryze.png' },
    items: [
      { name: '时光杖', icon: 'assets/lol/items/6657.png' },
      { name: '炽天使', icon: 'assets/lol/items/3040.png' },
      { name: '法穿棒', icon: 'assets/lol/items/3135.png' },
      { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
      { name: '帽子', icon: 'assets/lol/items/3089.png' },
      { name: '冰心', icon: 'assets/lol/items/3110.png' }
    ]
  }
};

var lolAdcGuideData = {
  title: '海斗 4.0｜ADC 出装公式',
  titlePrefix: '海斗 4.0',
  titleMain: 'ADC 出装公式',
  subtitle: '两件套满暴 · 输出与肉装按需选择',
  source: {
    title: '6.18热补后ADC公式4.0更新！舍弃无尽！肉装王朝！',
    url: 'https://www.bilibili.com/video/BV1A8j46xEsV',
    author: '以小冬'
  },
  formula: [
    {
      label: '出门',
      kicker: '950 金币',
      note: '正常选择守护者系列，根据英雄需要在攻击力与攻速之间取舍。',
      items: [
        { name: '守护者之刃', icon: 'assets/lol/items/3177.png' },
        { name: '守护者战锤', icon: 'assets/lol/items/3184.png' }
      ]
    },
    {
      label: '第一件',
      kicker: '优先荒野剑',
      note: '育恩塔尔属性全面；只有莎弥拉、卢锡安等不需要攻速的英雄优先收集者。',
      items: [
        { name: '荒野剑', icon: 'assets/lol/items/3032.png' },
        { name: '收集者', icon: 'assets/lol/items/6676.png' }
      ],
      champions: [
        { name: '莎弥拉', icon: 'assets/lol/champions/Samira.png' },
        { name: '卢锡安', icon: 'assets/lol/champions/Lucian.png' }
      ]
    },
    {
      label: '第二件',
      kicker: '大穿二选一',
      note: '在绿穿和红穿之间选择，前两件同时补足攻击力、穿甲、攻速和暴击。',
      items: [
        { name: '绿穿', fullName: '凡性的提醒', icon: 'assets/lol/items/3033.png' },
        { name: '红穿', fullName: '多米尼克领主的致意', icon: 'assets/lol/items/3036.png' }
      ]
    }
  ],
  branches: [
    {
      id: 'two-crits',
      tone: 'orange',
      title: '拿到 2 个暴击海克斯',
      badge: '常规成型',
      note: '11 级看完海克斯后，两件套已经满暴，后续直接进入输出装与肉装的按需选择。'
    },
    {
      id: 'one-crit',
      tone: 'gold',
      title: '只拿到 1 个暴击海克斯',
      badge: '第三件补暴击',
      note: '第三件在镜片和无尽之间二选一，再进入后续按需装备。',
      items: [
        { name: '镜片', icon: 'assets/lol/items/2523.png' },
        { name: '无尽', icon: 'assets/lol/items/3031.png' }
      ]
    },
    {
      id: 'terminus',
      tone: 'cyan',
      title: '界弓特例',
      badge: '大多数情况不出',
      note: '前三个海克斯至少有 2 个暴击且包含“暴击飞弹”，同时有叠层环境时，第二件改为镜片或无尽，第三件再做界弓。界弓需要攻击 6 次才能叠满。',
      items: [
        { name: '镜片', icon: 'assets/lol/items/2523.png' },
        { name: '无尽', icon: 'assets/lol/items/3031.png' },
        { name: '界弓', icon: 'assets/lol/items/3302.png' }
      ],
      champions: [
        { name: '芸阿娜', icon: 'assets/lol/champions/Yunara.png' },
        { name: '大嘴', icon: 'assets/lol/champions/KogMaw.png' }
      ]
    }
  ],
  laterGroups: [
    {
      title: '输出续航',
      tone: 'orange',
      items: [
        { name: '海妖', icon: 'assets/lol/items/6672.png' },
        { name: '破败', icon: 'assets/lol/items/3153.png' },
        { name: '饮血', icon: 'assets/lol/items/3072.png' },
        { name: '无穷饥渴', icon: 'assets/lol/items/2517.png' }
      ]
    },
    {
      title: '生存肉装',
      tone: 'green',
      items: [
        { name: '兰顿', icon: 'assets/lol/items/3143.png' },
        { name: '败魔', icon: 'assets/lol/items/2504.png' },
        { name: '贾修', icon: 'assets/lol/items/6665.png' }
      ]
    },
    {
      title: '强化特例',
      tone: 'purple',
      note: '拿到“魔转物”时可以考虑沙漏。',
      items: [
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ]
    }
  ],
  quickRules: [
    '小鞋子前期可以买；大鞋子一定等三件套以后再出，无脑选择吸血鞋',
    '神装后攻速足够，可以卖掉荒野剑换无尽，继续提高输出上限',
    '四个海克斯一个暴击都没有时，这套“满暴公式”不成立'
  ],
  boot: { name: '吸血鞋', icon: 'assets/lol/items/3008.png' }
};

var lolAssassinGuideData = {
  title: '海斗 3.0｜AP 刺客出装公式',
  subtitle: '带咒刃统一套公式，不带咒刃一人一套',
  source: {
    title: '海斗3.0AP战刺出装公式：买守护者系列！',
    url: 'https://www.bilibili.com/video/BV1snTk65EPf',
    author: '以小冬'
  },
  spellblade: {
    id: 'spellblade',
    title: '带咒刃',
    tagline: '统一公式 · 黄昏与黎明 / 巫妖之祸二选一',
    tone: 'gold',
    rows: [
      { label: '出门', type: 'starter', items: [
        { name: '守护者法球', icon: 'assets/lol/items/3112.png' },
        { name: '增幅典籍', icon: 'assets/lol/items/1052.png' }
      ] },
      { label: '咒刃', type: 'core', items: [
        { name: '黄昏与黎明', icon: 'assets/lol/items/2510.png' },
        { name: '巫妖之祸', icon: 'assets/lol/items/3100.png' }
      ] },
      { label: '神装', type: 'core', items: [
        { name: '影焰', icon: 'assets/lol/items/4645.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
        { name: '帽子', icon: 'assets/lol/items/3089.png' }
      ] },
      { label: '按需', type: 'optional', items: [
        { name: '重伤球', icon: 'assets/lol/items/3916.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ] },
      { label: '英雄', type: 'champion', items: [
        { name: '塞拉斯', icon: 'assets/lol/champions/Sylas.png' },
        { name: '小鱼人', icon: 'assets/lol/champions/Fizz.png' },
        { name: '阿卡丽', icon: 'assets/lol/champions/Akali.png' },
        { name: '艾克', icon: 'assets/lol/champions/Ekko.png' },
        { name: '寡妇', icon: 'assets/lol/champions/Evelynn.png' },
        { name: '伊泽瑞尔', icon: 'assets/lol/champions/Ezreal.png' },
        { name: '武器', icon: 'assets/lol/champions/Jax.png' },
        { name: '卡莎', icon: 'assets/lol/champions/Kaisa.png' }
      ] }
    ]
  },
  customBuilds: [
    {
      id: 'diana',
      champion: { name: '皎月', icon: 'assets/lol/champions/Diana.png' },
      note: '标准爆发公式',
      starter: [
        { name: '守护者法球', icon: 'assets/lol/items/3112.png' },
        { name: '增幅典籍', icon: 'assets/lol/items/1052.png' }
      ],
      items: [
        { name: '火箭腰带', icon: 'assets/lol/items/3152.png' },
        { name: '影焰', icon: 'assets/lol/items/4645.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
        { name: '帽子', icon: 'assets/lol/items/3089.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ]
    },
    {
      id: 'gwen',
      champion: { name: '格温', icon: 'assets/lol/champions/Gwen.png' },
      note: '三级 E 后主 Q；守护者之刃出门，先当战士玩',
      starter: [
        { name: '守护者之刃', icon: 'assets/lol/items/3177.png' },
        { name: '短剑', icon: 'assets/lol/items/1042.png' }
      ],
      items: [
        { name: '黄昏与黎明', icon: 'assets/lol/items/2510.png' },
        { name: '纳什之牙', icon: 'assets/lol/items/3115.png' },
        { name: '裂隙制造者', icon: 'assets/lol/items/4633.png' },
        { name: '影焰', icon: 'assets/lol/items/4645.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
        { name: '帽子', icon: 'assets/lol/items/3089.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ]
    },
    {
      id: 'kassadin',
      champion: { name: '卡萨丁', icon: 'assets/lol/champions/Kassadin.png' },
      note: '三眼泪特例；有尖端时把鞋位换成泪甲',
      starter: [
        { name: '爆裂魔杖', icon: 'assets/lol/items/1026.png' },
        { name: '女神泪', icon: 'assets/lol/items/3070.png' }
      ],
      items: [
        { name: '时光杖', icon: 'assets/lol/items/6657.png' },
        { name: '魔切', icon: 'assets/lol/items/3042.png' },
        { name: '大天使', icon: 'assets/lol/items/3003.png' },
        { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '实现器', icon: 'assets/lol/items/2522.png' }
      ]
    },
    {
      id: 'lillia',
      champion: { name: '莉莉娅', icon: 'assets/lol/champions/Lillia.png' },
      note: '不好活就出败魔、兰顿，生存装不寒碜',
      starter: [
        { name: '守护者法球', icon: 'assets/lol/items/3112.png' },
        { name: '增幅典籍', icon: 'assets/lol/items/1052.png' }
      ],
      items: [
        { name: '兰德里', icon: 'assets/lol/items/6653.png' },
        { name: '裂隙制造者', icon: 'assets/lol/items/4633.png' },
        { name: '吸血鞋', icon: 'assets/lol/items/3008.png' },
        { name: '放血者', icon: 'assets/lol/items/4010.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' },
        { name: '影焰', icon: 'assets/lol/items/4645.png' }
      ]
    },
    {
      id: 'rumble',
      champion: { name: '兰博', icon: 'assets/lol/champions/Rumble.png' },
      note: '持续灼烧与法穿公式',
      starter: [
        { name: '守护者法球', icon: 'assets/lol/items/3112.png' },
        { name: '增幅典籍', icon: 'assets/lol/items/1052.png' }
      ],
      items: [
        { name: '兰德里', icon: 'assets/lol/items/6653.png' },
        { name: '裂隙制造者', icon: 'assets/lol/items/4633.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '法穿鞋', icon: 'assets/lol/items/3020.png' },
        { name: '帽子', icon: 'assets/lol/items/3089.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ]
    },
    {
      id: 'udyr',
      champion: { name: '乌迪尔', icon: 'assets/lol/champions/Udyr.png' },
      note: '影焰爆发版持续进场公式',
      starter: [
        { name: '守护者法球', icon: 'assets/lol/items/3112.png' },
        { name: '增幅典籍', icon: 'assets/lol/items/1052.png' }
      ],
      items: [
        { name: '兰德里', icon: 'assets/lol/items/6653.png' },
        { name: '影焰', icon: 'assets/lol/items/4645.png' },
        { name: '虚空之杖', icon: 'assets/lol/items/3135.png' },
        { name: '法穿鞋', icon: 'assets/lol/items/3020.png' },
        { name: '帽子', icon: 'assets/lol/items/3089.png' },
        { name: '中娅', icon: 'assets/lol/items/3157.png' }
      ]
    }
  ],
  quickRules: [
    '不要随意优化出门装：守护者法球对近战进场很重要，无蓝条英雄还能获得高额生命回复',
    '有术士果汁盒时，吸血鞋可以换成法穿鞋，进一步提高中期统治力',
    '经常需要自己补重伤球：切后排单挑时，队友无法替你挂重伤',
    '不要盲目切后排；队友是金克斯这类英雄时，应配合从前排往后排打'
  ]
};
