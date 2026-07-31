const { createApp } = Vue;

marked.use({
  renderer: {
    link({ href, raw, tokens }) {
      if (!raw.startsWith("[")) return this.parser.parseInline(tokens);
      const text = this.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank">${text}</a>`;
    }
  }
});

/* ─── Obsidian Preprocessor ─── */

function stripWikilinks(md) {
  md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  md = md.replace(/\[\[([^\]]+)\]\]/g, function(m, path) {
    var parts = path.split('/');
    return parts[parts.length - 1].replace(/\.md$/, '');
  });
  return md;
}

function buildCallout(type, expand, title, contentHtml) {
  if (expand === '-') {
    return '<details class="callout callout-' + type + '"><summary>' + title + '</summary><div class="callout-body">' + contentHtml + '</div></details>';
  }
  return '<div class="callout callout-' + type + '"><div class="callout-title">' + title + '</div><div class="callout-body">' + contentHtml + '</div></div>';
}

function preprocessObsidian(md, markedFn) {
  md = md.replace(/^---\n[\s\S]*?\n---\n?/, '');
  md = stripWikilinks(md);

  var lines = md.split('\n');
  var placeholders = [];
  var result = [];
  var inCallout = false;
  var calloutType = '';
  var calloutExpand = '';
  var calloutTitle = '';
  var calloutLines = [];

  function flushCallout() {
    var raw = calloutLines.join('\n').trim();
    var contentHtml = markedFn(raw);
    var html = buildCallout(calloutType, calloutExpand, calloutTitle, contentHtml);
    var ph = '<div data-callout="' + placeholders.length + '"></div>';
    placeholders.push(html);
    result.push(ph);
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var cm = line.match(/^> \[!(\w+)\]([+-])?\s*(.*)/);
    if (cm) {
      if (inCallout) flushCallout();
      inCallout = true;
      calloutType = cm[1];
      calloutExpand = cm[2] || '';
      calloutTitle = cm[3].replace(/（来源：.*?）\s*$/, '').replace(/\(来源：.*?\)\s*$/, '').trim();
      calloutLines = [];
    } else if (inCallout && line.startsWith('>')) {
      var content = line.slice(1);
      if (content.startsWith(' ')) content = content.slice(1);
      calloutLines.push(content);
    } else {
      if (inCallout) {
        flushCallout();
        inCallout = false;
      }
      result.push(line);
    }
  }
  if (inCallout) flushCallout();

  var processed = result.join('\n');
  var html = markedFn(processed);

  for (var p = 0; p < placeholders.length; p++) {
    html = html.replace('<div data-callout="' + p + '"></div>', placeholders[p]);
  }

  return html;
}

/* ─── Valorant tactical enhancement ─── */

function valorantRoleLabel(role) {
  if (!role) return '';
  return role;
}

// 把任意字符串解析为「卡片 token」数组：
// 命中 agent 名/别名 → 头像卡；命中角色位（一突/烟位/先锋位/哨卫/决斗/控场）→ 灰色角色位卡；其余 → 文字残留（单卡合并）
function valorantParseTeam(str) {
  if (!str) return [];
  // 去掉行内括注（如「（可换迷核）」「（首选一突）」），保留主句
  var cleaned = str.replace(/[（(][^()]*[）)]/g, '').trim();
  // 标准分隔符
  var rawTokens = cleaned.split(/[、/，,；;]|或者|或(?=[^])/).map(function (t) { return t.trim(); }).filter(Boolean);
  // 由于"或"分割会把"捷风/迷核"两类拆开，保留原"X或Y"语义时需把斜杠视作"备选"——这里简化为并列卡
    var agentMap = (typeof valorantAgents !== 'undefined') ? valorantAgents : {};
    var agentDetails = (typeof valorantAgentDetails !== 'undefined') ? valorantAgentDetails : {};
  var aliasMap = (typeof valorantAgentAlias !== 'undefined') ? valorantAgentAlias : {};
  // 角色位描述词（灰色占位卡）
  var roleSlots = {
    '一突': '决斗',
    '烟位': '控场',
    '烟卫': '控场',
    '先锋位': '先锋',
    '哨卫': '哨卫',
    '守卫': '哨卫',
    '决斗': '决斗',
    '决斗位': '决斗',
    '控场': '控场',
    '控场位': '控场',
    '先锋': '先锋',
    '双决斗': '决斗',
    '双烟': '控场'
  };
  var result = [];
  var textTail = [];
  rawTokens.forEach(function (tok) {
    if (!tok) return;
    // 角色位占位
    if (roleSlots[tok]) {
      result.push({ kind: 'role', role: roleSlots[tok] });
      return;
    }
    // agent（先走别名归一）
    var canon = aliasMap[tok] || tok;
    var info = agentMap[canon];
    var detail = agentDetails[canon];
    if (info) {
      result.push({ kind: 'agent', name: canon, role: info.role, tone: info.tone, icon: detail && detail.icon || info.icon });
      return;
    }
    // 形如「捷风+猎枭+瑞娜 中路」（站位混进来了）—— 拆出文字并把里面 agent 挑出来
    var inlineAgents = tok.match(/[A-Za-zK/O]+|[一-龥]/g);
    if (inlineAgents && inlineAgents.length > 1) {
      var foundAny = false;
      inlineAgents.forEach(function (nm) {
        var c2 = aliasMap[nm] || nm;
        var i2 = agentMap[c2];
        var d2 = agentDetails[c2];
        if (i2) { result.push({ kind: 'agent', name: c2, role: i2.role, tone: i2.tone, icon: d2 && d2.icon || i2.icon }); foundAny = true; }
      });
      if (foundAny) return;
    }
    // 其它残留：当作文字尾注
    textTail.push(tok);
  });
  if (textTail.length) result.push({ kind: 'text', text: textTail.join(' / ') });
  return result;
}

// HTML 转义
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 把"推荐阵容"一项渲染成卡片串
function valorantRenderTeamCards(team) {
  var html = '<div class="val-team">';
  team.forEach(function (t) {
    if (t.kind === 'agent') {
      html += '<figure class="val-pick val-pick-agent val-tone-' + (t.tone || '') + '">'
        + '<img src="' + t.icon + '" alt="' + esc(t.name) + '" loading="lazy">'
        + '<figcaption>' + esc(t.name) + '</figcaption>'
        + (t.role ? '<span class="val-role-tag val-role-' + (t.tone || '') + '">' + esc(t.role) + '</span>' : '')
        + '</figure>';
    } else if (t.kind === 'role') {
      html += '<figure class="val-pick val-pick-role">'
        + '<div class="val-role-placeholder">' + esc(t.role) + '</div>'
        + '<figcaption>' + esc(t.role) + '</figcaption>'
        + '</figure>';
    } else if (t.kind === 'text') {
      html += '<span class="val-team-note">' + esc(t.text) + '</span>';
    }
  });
  html += '</div>';
  return html;
}

// 把「阶段 | 动作」表渲染成时间线
function valorantRenderTimeline(rows) {
  if (!rows || !rows.length) return '';
  var html = '<div class="val-timeline">';
  html += '<div class="val-timeline-track">';
  rows.forEach(function (r, i) {
    var isLast = i === rows.length - 1;
    html += '<div class="val-tl-node' + (isLast ? ' is-last' : '') + '">'
      + '<span class="val-tl-dot">' + (i + 1) + '</span>'
      + '<span class="val-tl-label">' + esc(r.phase) + '</span>'
      + '</div>';
  });
  html += '</div>';
  html += '<div class="val-timeline-rows">';
  rows.forEach(function (r) {
    html += '<div class="val-tl-row"><div class="val-tl-phase">' + esc(r.phase) + '</div>'
      + '<div class="val-tl-action">' + r.action + '</div></div>';
  });
  html += '</div></div>';
  return html;
}

// 增强 valorant HTML：替换 callout 内的"推荐阵容"列表项 与 「阶段|动作」表
function enhanceValorantHtml(html) {
  if (!html) return html;
  // 1) 替换「推荐阵容：<...></li>」
  html = html.replace(/<li><strong>推荐阵容<\/strong>：([\s\S]*?)<\/li>/g, function (m, body) {
    var team = valorantParseTeam(body);
    if (!team.length) return m;
    return '<li class="val-team-li"><strong class="val-li-label">推荐阵容</strong>' + valorantRenderTeamCards(team) + '</li>';
  });
  // 2) 替换「站位:...</li>」→ 给 li 加个标识类,样式上单独处理
  html = html.replace(/<li><strong>站位<\/strong>：(.*?)<\/li>/g, '<li class="val-position-li"><strong class="val-li-label">站位</strong><span class="val-position">$1</span></li>');
  // 3) 把 callout 内的表(首列"阶段"次列"动作")替换成时间线
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, function (m, inner) {
    // 仅当表头首格为"阶段"时处理
    if (!/<th[^>]*>\s*阶段\s*<\/th>/.test(inner)) return m;
    var rows = [];
    var trRe = /<tr>([\s\S]*?)<\/tr>/g;
    var match;
    while ((match = trRe.exec(inner)) !== null) {
      var cells = match[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || [];
      if (cells.length < 2) continue;
      var phase = (cells[0] || '').replace(/<[^>]+>/g, '').trim();
      var action = (cells[1] || '').replace(/^<t[dh][^>]*>/, '').replace(/<\/t[dh]>$/, '').trim();
      if (!phase || phase === '阶段') continue;
      rows.push({ phase: phase, action: action });
    }
    return valorantRenderTimeline(rows);
  });
  return html;
}

/* ─── Valorant View ─── */

const ValorantView = {
  template: `
    <div class="valorant-view">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else class="valorant-workspace">
        <aside class="valorant-sidebar">
          <a class="valorant-backlink" href="../index.html">← 返回熊窝</a>
          <div class="valorant-brand">
            <span class="valorant-brand-mark" aria-hidden="true">
              <svg class="valorant-brand-icon" viewBox="0 0 48 48" focusable="false">
                <path d="M7 7h9l8 23 8-23h9L24 41z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" />
                <path d="M19 7h10l-5 14z" fill="currentColor" />
              </svg>
            </span>
            <div><strong>无畏契约</strong><small>战术资料库</small></div>
          </div>
          <div class="valorant-sidebar-meta"><span>KNOWLEDGE BASE</span><strong>{{ sections.length }} 个板块</strong></div>
          <nav class="valorant-nav" aria-label="无畏契约板块">
            <button
              v-for="(s, i) in sections"
              :key="s.id"
              class="valorant-nav-item"
              :class="{ active: activeSection === s.id }"
              @click="selectSection(s.id)"
            >
              <span class="valorant-nav-number">{{ indexLabel(i) }}</span>
              <span class="valorant-nav-icon" :class="{ 'has-map-image': mapIcon(s.title) }" aria-hidden="true">
                <img v-if="mapIcon(s.title)" :src="mapIcon(s.title)" :alt="s.title">
                <svg viewBox="0 0 32 32" focusable="false">
                  <path d="M6 8.5 12 6l8 3 6-2.5v17L20 26l-8-3-6 2.5z" />
                  <path d="M12 6v17M20 9v17" />
                  <path d="m14.5 13 2-2 2 2-2 2z" class="valorant-nav-icon-mark" />
                </svg>
              </span>
              <span class="valorant-nav-title">{{ s.title }}</span>
              <span class="valorant-nav-arrow">›</span>
            </button>
          </nav>
        </aside>
        <main class="valorant-content">
          <header class="valorant-hero">
            <div><span class="valorant-kicker">VALORANT FIELD NOTES</span><h1>无畏契约</h1><p>地图战术 · 排位图池 · 决策框架</p></div>
            <div class="valorant-hero-count"><strong>{{ indexLabel(sections.findIndex(s => s.id === activeSection)) }}</strong><span>/ {{ sections.length }}</span></div>
          </header>
          <section
            v-for="section in sections"
            :key="section.id"
            v-show="activeSection === section.id"
            class="valorant-panel"
          >
            <div class="valorant-panel-heading"><span>SECTION {{ indexLabel(sections.indexOf(section)) }}</span><h2>{{ section.title }}</h2></div>
            <article v-if="section.id === 'overview'" class="valorant-blog-home">
              <header class="valorant-blog-meta"><span>无畏契约 · 战术资料库</span><span>阅读指南</span></header>
              <h3>把地图理解，整理成可以执行的回合决策</h3>
              <p>这是一份持续整理中的无畏契约地图笔记。它不追求把所有点位一次性罗列出来，而是从进攻、防守、选位和 Lineup 四个角度，记录地图里的关键约束，以及队伍可以怎样利用这些约束。</p>
              <p>阅读一张地图时，可以先看它的战术章节，再回到选位和 Lineup。遇到具体回合时，不要只寻找“正确答案”，而是结合敌方站位、技能交换、人数和时间，选择当前信息下更合适的动作。</p>
              <hr>
              <h4>战术库建设规范</h4>
              <p>后续补充地图时，先保证基础覆盖，再增加特殊细节。每张地图至少维护 4 条进攻与 4 条防守战术，并尽量让它们覆盖不同的回合模型：</p>
              <ol>
                <li>默认控图：说明开局分工、基础信息和第一轮资源交换。</li>
                <li>快速爆弹：说明如何集中技能，在短时间内突破一个区域。</li>
                <li>双向夹击：说明两路如何同步推进，避免队伍被分段处理。</li>
                <li>假打、转点或针对性战术：说明如何根据对手习惯改变节奏。</li>
              </ol>
              <p>每条战术尽量使用统一字段：核心逻辑、推荐阵容、站位、阶段动作、适用场景，以及失败后的调整方案。这样以后复盘时，看到的不只是一套脚本，也能知道这套脚本依赖什么信息、什么时候应该放弃。</p>
              <hr>
              <h4>元认知：打瓦本质的理解——每个时间节点的最优解</h4>
              <p><strong>核心思路链条：</strong>打瓦的本质不是背板，而是能否在每一个时刻、每一个时间节点，找到当前节点的最优解。这个思路链条把散乱的战术、站位、心态问题串成同一个框架。</p>
              <p>同样的“最优解”在不同时间节点指代不同：开局是分工与信息；中段是资源置换与转点判断；残局是信息整合与个人决策。</p>
              <h5>三个具体场景</h5>
              <ol>
                <li><strong>队伍气氛压抑、连续丢分时：</strong>是否愿意多说几句、主动给出意见、稳定团队情绪，而非沉默不语让气氛继续下沉。软层面的最优解往往是“开口”，不是“打得更好”。</li>
                <li><strong>面前有大量脚步、判断三四个人同时出时：</strong>是站在开阔视野架枪追求“看到更多”，还是主动利用掩体打闪身枪，只接自己有把握的那一下。微观对枪的最优解通常是“减少不确定对枪”，不是“看到更多”。</li>
                <li><strong>结合上局信息做调整：</strong>是否能把上局观察沉淀成本局的具体动作（转点、加防、改变默认），让本局获胜概率高于机械重复。调整型最优解的核心是“信息闭环”，不是“打得更准”。</li>
              </ol>
              <h5>统一判断口诀</h5>
              <p>看到信息 → 判断此刻约束（人数、位置、资源、心态） → 选当前约束下的最优动作 → 执行后立即把新信息接进下个节点。沉默、漏信息、按惯性打，都属于“没有找到最优解”。</p>
            </article>
            <div v-if="section.subSections && section.subSections.length > 1" class="vmap-tabs">
              <button
                v-for="sub in section.subSections"
                :key="sub.id"
                class="vmap-tab"
                :class="{ active: activeSub[section.id] === sub.id }"
                @click="activeSub[section.id] = sub.id"
              >{{ sub.title }}</button>
            </div>
            <div v-if="activeSubForSection(section)" class="valorant-body" v-html="activeSubForSection(section).html"></div>
            <div v-else class="valorant-body" v-html="section.html"></div>
          </section>
        </main>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      sections: [],
      activeSection: '',
      activeSub: {}
    };
  },
  methods: {
    indexLabel(i) {
      return String(i + 1).padStart(2, '0');
    },
    mapIcon(title) {
      var icons = {
        '亚海悬城': 'ascent',
        '霓虹町': 'split',
        '深海明珠': 'pearl',
        '莲华古城': 'lotus',
        '隐世修所': 'haven',
        '源工重镇': 'bind',
        '盐海矿镇': 'corrode',
        '天枢云阙': 'summit',
        '日落之城': 'sunset',
        '微风岛屿': 'breeze',
        '森寒冬港': 'icebox',
        '裂变峡谷': 'fracture',
        '深窟幽境': 'abyss'
      };
      return icons[title] ? '../assets/valorant/maps/' + icons[title] + '.png' : '';
    },
    splitByHeading(html) {
      var sections = [];
      var h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
      var prevSection = null;
      var match;
      while ((match = h1Regex.exec(html)) !== null) {
        var title = match[1].replace(/<[^>]+>/g, '').trim();
        if (prevSection) {
          prevSection.html = html.slice(prevSection.startIdx, match.index);
        }
        var id = 'sec-' + sections.length;
        prevSection = { id: id, title: title, html: '', searchText: title, startIdx: match.index };
        sections.push(prevSection);
      }
      if (prevSection) {
        prevSection.html = html.slice(prevSection.startIdx);
      }
      return sections;
    },
    splitSubSections(html) {
      var subs = [];
      var h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
      var matches = [];
      var match;
      while ((match = h2Regex.exec(html)) !== null) {
        matches.push({ title: match[1].replace(/<[^>]+>/g, '').trim(), index: match.index });
      }
      for (var i = 0; i < matches.length; i++) {
        var startIdx = matches[i].index;
        var endIdx = i + 1 < matches.length ? matches[i + 1].index : html.length;
        subs.push({ id: 'sub-' + i, title: matches[i].title, html: html.slice(startIdx, endIdx) });
      }
      return subs;
    },
    activeSubForSection(section) {
      var subId = this.activeSub[section.id];
      if (!subId || !section.subSections) return null;
      for (var i = 0; i < section.subSections.length; i++) {
        if (section.subSections[i].id === subId) return section.subSections[i];
      }
      return null;
    },
    selectSection(id) {
      this.activeSection = id;
      if (!this.activeSub[id]) {
        var section = this.sections.find(function(s) { return s.id === id; });
        if (section && section.subSections && section.subSections.length) {
          this.activeSub[id] = section.subSections[0].id;
        }
      }
    },
    loadContent() {
      try {
        var mapMd = typeof valorantMapMd !== 'undefined' ? valorantMapMd : '';

        if (!mapMd) throw new Error('数据文件未加载，请重建 valorant-data.js');

        var render = function(md) { return marked.parse(md); };
        var mapHtml = preprocessObsidian(mapMd, render);
        mapHtml = mapHtml.replace(/<h1[^>]*>.*?<\/h1>/, '');
        mapHtml = mapHtml.replace(/<h2/g, '<h1').replace(/<\/h2>/g, '</h1>');
        mapHtml = mapHtml.replace(/<h3/g, '<h2').replace(/<\/h3>/g, '</h2>');
        mapHtml = enhanceValorantHtml(mapHtml);
        mapHtml = mapHtml.replace(/<h2[^>]*>常见失误<\/h2>/g, '<h2>经典选位</h2>');
        mapHtml = mapHtml.replace(/<h2[^>]*>零散观察<\/h2>[\s\S]*?(?=<h1|$)/g, '');

        var rawSections = this.splitByHeading(mapHtml);
        if (rawSections.length >= 3) {
          var lastSection = rawSections[rawSections.length - 1];
          var mergeCommonTips = lastSection.title === '通用技巧';
          // 首页正文已经承载元认知；排位图池与总表不放进长期入口文章。
          var mergedHtml = '';
          if (mergeCommonTips) mergedHtml += lastSection.html;
          var merged = {
            id: 'overview',
            title: '战术库首页',
            html: mergedHtml,
            searchText: '战术库首页 元认知 全地图 通用技巧 建设规范'
          };
          var rest = mergeCommonTips
            ? rawSections.slice(2, -1)
            : rawSections.slice(2);
          this.sections = [merged].concat(rest);
        } else {
          this.sections = rawSections;
        }

        // 按侧边栏阅读顺序排列：把暂时最少游玩的三张图放到后段。
        var sectionOrder = [
          '战术库首页',
          '亚海悬城',
          '霓虹町',
          '深海明珠',
          '莲华古城',
          '隐世修所',
          '源工重镇',
          '盐海矿镇',
          '天枢云阙',
          '日落之城',
          '微风岛屿',
          '森寒冬港',
          '裂变峡谷',
          '深窟幽境'
        ];
        this.sections.sort(function(a, b) {
          var aIndex = sectionOrder.indexOf(a.title);
          var bIndex = sectionOrder.indexOf(b.title);
          return (aIndex === -1 ? sectionOrder.length : aIndex)
            - (bIndex === -1 ? sectionOrder.length : bIndex);
        });
        for (var i = 0; i < this.sections.length; i++) {
          var sec = this.sections[i];
          if (sec.id !== 'overview' && !/<h2[^>]*>经典选位<\/h2>/.test(sec.html)) {
            sec.html += '<h2>经典选位</h2><p>（待补充）</p>';
          }
          var subs = this.splitSubSections(sec.html);
          sec.subSections = subs;
          if (subs.length > 0) {
            this.activeSub[sec.id] = subs[0].id;
          }
        }
        if (this.sections.length) this.activeSection = this.sections[0].id;
        this.loading = false;
      } catch (err) {
        this.sections = [{ id: 'error', title: '加载失败', html: '<p>' + err.message + '</p><p>请确认软链和网络正常</p>', searchText: '' }];
        this.loading = false;
      }
    }
  },
  mounted() {
    this.loadContent();
  }
};



createApp({
  template: "<valorant-view></valorant-view>"
}).component("valorant-view", ValorantView).mount("#app");
