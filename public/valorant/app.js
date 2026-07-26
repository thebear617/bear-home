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
    if (info) {
      result.push({ kind: 'agent', name: canon, role: info.role, tone: info.tone, icon: info.icon });
      return;
    }
    // 形如「捷风+猎枭+瑞娜 中路」（站位混进来了）—— 拆出文字并把里面 agent 挑出来
    var inlineAgents = tok.match(/[A-Za-zK/O]+|[一-龥]/g);
    if (inlineAgents && inlineAgents.length > 1) {
      var foundAny = false;
      inlineAgents.forEach(function (nm) {
        var c2 = aliasMap[nm] || nm;
        var i2 = agentMap[c2];
        if (i2) { result.push({ kind: 'agent', name: c2, role: i2.role, tone: i2.tone, icon: i2.icon }); foundAny = true; }
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
          <a class="valorant-backlink" href="../">← 返回熊窝</a>
          <div class="valorant-brand">
            <span class="valorant-brand-mark">V</span>
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
            ><span class="valorant-nav-number">{{ indexLabel(i) }}</span><span class="valorant-nav-title">{{ s.title }}</span><span class="valorant-nav-arrow">›</span></button>
          </nav>
        </aside>
        <main class="valorant-content">
          <header class="valorant-hero">
            <div><span class="valorant-kicker">VALORANT FIELD NOTES</span><h1>无畏契约</h1><p>地图战术 · 排位图池 · 决策框架</p></div>
            <div class="valorant-hero-count"><strong>{{ indexLabel(sections.findIndex(s => s.id === activeSection) + 1) }}</strong><span>/ {{ sections.length }}</span></div>
          </header>
          <section
            v-for="section in sections"
            :key="section.id"
            v-show="activeSection === section.id"
            class="valorant-panel"
          >
            <div class="valorant-panel-heading"><span>SECTION {{ indexLabel(sections.indexOf(section) + 1) }}</span><h2>{{ section.title }}</h2></div>
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

        var rawSections = this.splitByHeading(mapHtml);
        if (rawSections.length >= 3) {
          var lastSection = rawSections[rawSections.length - 1];
          var mergeCommonTips = lastSection.title === '通用技巧';
          var mergedHtml = rawSections[0].html + rawSections[1].html;
          if (mergeCommonTips) mergedHtml += lastSection.html;
          var merged = {
            id: 'overview',
            title: '全局战术总览',
            html: mergedHtml,
            searchText: '元认知 全地图 通用技巧'
          };
          var rest = mergeCommonTips
            ? rawSections.slice(2, -1)
            : rawSections.slice(2);
          this.sections = [merged].concat(rest);
        } else {
          this.sections = rawSections;
        }
        for (var i = 0; i < this.sections.length; i++) {
          var sec = this.sections[i];
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
