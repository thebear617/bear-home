const { createApp } = Vue;

marked.use({
  renderer: {
    link({ href, raw, tokens }) {
      if (!raw.startsWith('[')) return this.parser.parseInline(tokens);
      const text = this.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank">${text}</a>`;
    }
  }
});

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }

function parseHM(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
function minToHM(min) {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${pad(h)}:${pad(m)}`;
}

/* ─── Lunar calendar ─── */

const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const LUNAR_DAY_MAP = {
  1: '初一', 2: '初二', 3: '初三', 4: '初四', 5: '初五', 6: '初六', 7: '初七', 8: '初八', 9: '初九', 10: '初十',
  11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五', 16: '十六', 17: '十七', 18: '十八', 19: '十九',
  20: '二十', 21: '廿一', 22: '廿二', 23: '廿三', 24: '廿四', 25: '廿五', 26: '廿六', 27: '廿七', 28: '廿八',
  29: '廿九', 30: '三十'
};
const LUNAR_STARTS = [
  [1, 19, 12], [2, 17, 1], [3, 19, 2], [4, 17, 3],
  [5, 17, 4], [6, 15, 5], [7, 15, 6], [8, 13, 7],
  [9, 12, 8], [10, 11, 9], [11, 10, 10], [12, 9, 11]
];

function getLunarDayName(n) { return LUNAR_DAY_MAP[n] || String(n); }

function getLunarInfo(year, month, day) {
  const target = new Date(year, month - 1, day);
  if (month === 1 && day < 19) {
    const prevNov1 = new Date(2025, 11, 21);
    const diff = Math.floor((target - prevNov1) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 30) return { lMonth: 11, lDay: diff + 1, lMonthName: '十一月', isStart: diff === 0 };
    if (diff >= 30) return { lMonth: 12, lDay: diff - 29, lMonthName: '十二月', isStart: diff === 30 };
    return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  }
  let best = null;
  for (const [m, d, lm] of LUNAR_STARTS) {
    const s = new Date(year, m - 1, d);
    if (s <= target) best = { start: s, lMonth: lm };
  }
  if (!best) return { lMonth: 11, lDay: 20, lMonthName: '十一月', isStart: false };
  const diff = Math.floor((target - best.start) / (1000 * 60 * 60 * 24));
  return { lMonth: best.lMonth, lDay: diff + 1, lMonthName: LUNAR_MONTH_NAMES[best.lMonth], isStart: diff + 1 === 1 };
}

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
      <div v-else>
        <header class="valorant-hero">
          <h1>无畏契约</h1>
          <p>地图战术 · 排位图池 · 决策框架</p>
        </header>
        <div class="valorant-switcher">
          <button
            v-for="(s, i) in sections"
            :key="s.id"
            :class="{ active: activeSection === s.id }"
            @click="selectSection(s.id)"
          ><span>{{ indexLabel(i) }}</span><strong>{{ s.title }}</strong></button>
        </div>
        <section
          v-for="section in sections"
          :key="section.id"
          v-show="activeSection === section.id"
          class="valorant-panel"
        >
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
        if (rawSections.length >= 2) {
          var mergedHtml = rawSections[0].html + rawSections[1].html;
          var merged = { id: 'overview', title: '元认知与全地图', html: mergedHtml, searchText: '元认知 全地图' };
          var rest = rawSections.slice(2);
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

/* ─── League of Legends View ─── */

const LolMageGuide = {
  props: ['guide'],
  template: `
    <div class="lol-guide-panel lol-mage-guide">
      <header class="lol-hero">
        <h1>{{ guide.title }}</h1>
        <p>{{ guide.subtitle }}</p>
      </header>

      <section
        v-for="build in guide.builds"
        :key="build.id"
        class="lol-build"
        :class="'lol-tone-' + build.tone"
      >
        <div class="lol-build-heading">
          <h2>{{ build.title }}</h2>
          <span>{{ build.tagline }}</span>
        </div>
        <div v-for="row in build.rows" :key="row.label" class="lol-row">
          <div class="lol-row-label" :class="'lol-label-' + row.type">{{ row.label }}</div>
          <div class="lol-picks">
            <template v-for="(item, index) in row.items" :key="item.name">
              <span v-if="row.join && index > 0" class="lol-join">{{ row.join }}</span>
              <figure class="lol-pick" :class="{ 'lol-pick-champion': row.type === 'champion', 'lol-pick-starter': row.type === 'starter' }">
                <img :src="item.icon" :alt="item.name" loading="lazy">
                <figcaption>{{ item.name }}</figcaption>
              </figure>
            </template>
          </div>
        </div>
      </section>

      <section class="lol-rules">
        <h2>快速规则</h2>
        <ul>
          <li v-for="rule in guide.quickRules" :key="rule">{{ rule }}</li>
        </ul>
        <div v-if="guide.special" class="lol-special">
          <h3>{{ guide.special.label }}</h3>
          <div class="lol-picks lol-special-picks">
            <figure class="lol-pick lol-pick-champion">
              <img :src="guide.special.champion.icon" :alt="guide.special.champion.name" loading="lazy">
              <figcaption>{{ guide.special.champion.name }}</figcaption>
            </figure>
            <figure v-for="item in guide.special.items" :key="item.name" class="lol-pick">
              <img :src="item.icon" :alt="item.name" loading="lazy">
              <figcaption>{{ item.name }}</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </div>
  `
};

const LolAdcGuide = {
  props: ['guide'],
  template: `
    <div class="lol-guide-panel lol-adc-guide">
      <header class="lol-hero lol-adc-hero">
        <h1>
          <span class="lol-adc-title-part">{{ guide.titlePrefix }}</span>
          <span class="lol-adc-title-divider">｜</span>
          <span class="lol-adc-title-part">{{ guide.titleMain }}</span>
        </h1>
        <p>{{ guide.subtitle }}</p>
        <a class="lol-source" :href="guide.source.url" target="_blank" rel="noopener">
          来源：{{ guide.source.author }} · 查看原视频 ↗
        </a>
      </header>

      <section class="lol-adc-card lol-formula-card">
        <div class="lol-adc-heading">
          <span>CORE FORMULA</span>
          <h2>两件套公式</h2>
        </div>
        <div class="lol-formula-steps">
          <article v-for="(step, index) in guide.formula" :key="step.label" class="lol-formula-step">
            <div class="lol-step-topline">
              <span class="lol-step-number">{{ index + 1 }}</span>
              <div>
                <h3>{{ step.label }}</h3>
                <strong>{{ step.kicker }}</strong>
              </div>
            </div>
            <p>{{ step.note }}</p>
            <div class="lol-picks lol-adc-picks">
              <figure v-for="item in step.items" :key="item.name" class="lol-pick">
                <img :src="item.icon" :alt="item.fullName || item.name" loading="lazy">
                <figcaption>{{ item.name }}</figcaption>
                <small v-if="item.fullName">{{ item.fullName }}</small>
              </figure>
            </div>
            <div v-if="step.champions" class="lol-adc-exception">
              <span>仅这类英雄优先收集者</span>
              <div class="lol-picks lol-adc-picks">
                <figure v-for="champion in step.champions" :key="champion.name" class="lol-pick lol-pick-champion">
                  <img :src="champion.icon" :alt="champion.name" loading="lazy">
                  <figcaption>{{ champion.name }}</figcaption>
                </figure>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="lol-adc-card">
        <div class="lol-adc-heading">
          <span>CRIT CHECK</span>
          <h2>11 级海克斯分支</h2>
        </div>
        <div class="lol-branch-grid">
          <article v-for="branch in guide.branches" :key="branch.id" class="lol-branch-card" :class="'lol-adc-tone-' + branch.tone">
            <span class="lol-branch-badge">{{ branch.badge }}</span>
            <h3>{{ branch.title }}</h3>
            <p>{{ branch.note }}</p>
            <div v-if="branch.items" class="lol-picks lol-adc-picks">
              <figure v-for="item in branch.items" :key="item.name" class="lol-pick">
                <img :src="item.icon" :alt="item.name" loading="lazy">
                <figcaption>{{ item.name }}</figcaption>
              </figure>
            </div>
            <div v-if="branch.champions" class="lol-adc-branch-champions">
              <span>适用英雄</span>
              <div class="lol-picks lol-adc-picks">
                <figure v-for="champion in branch.champions" :key="champion.name" class="lol-pick lol-pick-champion">
                  <img :src="champion.icon" :alt="champion.name" loading="lazy">
                  <figcaption>{{ champion.name }}</figcaption>
                </figure>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="lol-adc-card">
        <div class="lol-adc-heading">
          <span>AFTER CORE</span>
          <h2>后续按需装备</h2>
          <p>不是固定顺序，根据输出、续航和生存需求选择。</p>
        </div>
        <div class="lol-later-grid">
          <article v-for="group in guide.laterGroups" :key="group.title" class="lol-later-group" :class="'lol-adc-tone-' + group.tone">
            <h3>{{ group.title }}</h3>
            <p v-if="group.note">{{ group.note }}</p>
            <div class="lol-picks lol-adc-picks">
              <figure v-for="item in group.items" :key="item.name" class="lol-pick">
                <img :src="item.icon" :alt="item.name" loading="lazy">
                <figcaption>{{ item.name }}</figcaption>
              </figure>
            </div>
          </article>
        </div>
      </section>

      <section class="lol-rules lol-adc-rules">
        <h2>快速规则</h2>
        <ul>
          <li v-for="rule in guide.quickRules" :key="rule">{{ rule }}</li>
        </ul>
        <div class="lol-adc-boot">
          <span>三件套后</span>
          <figure class="lol-pick">
            <img :src="guide.boot.icon" :alt="guide.boot.name" loading="lazy">
            <figcaption>{{ guide.boot.name }}</figcaption>
          </figure>
        </div>
      </section>
    </div>
  `
};

const LolAssassinGuide = {
  props: ['guide'],
  template: `
    <div class="lol-guide-panel lol-assassin-guide">
      <header class="lol-hero">
        <h1>{{ guide.title }}</h1>
        <p>{{ guide.subtitle }}</p>
        <a class="lol-source" :href="guide.source.url" target="_blank" rel="noopener">
          来源：{{ guide.source.author }} · 查看原视频 ↗
        </a>
      </header>

      <section class="lol-build" :class="'lol-tone-' + guide.spellblade.tone">
        <div class="lol-build-heading">
          <h2>{{ guide.spellblade.title }}</h2>
          <span>{{ guide.spellblade.tagline }}</span>
        </div>
        <div v-for="row in guide.spellblade.rows" :key="row.label" class="lol-row">
          <div class="lol-row-label" :class="'lol-label-' + row.type">{{ row.label }}</div>
          <div class="lol-picks">
            <figure
              v-for="item in row.items"
              :key="item.name"
              class="lol-pick"
              :class="{ 'lol-pick-champion': row.type === 'champion', 'lol-pick-starter': row.type === 'starter' }"
            >
              <img :src="item.icon" :alt="item.name" loading="lazy">
              <figcaption>{{ item.name }}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="lol-build lol-tone-purple lol-assassin-custom">
        <div class="lol-build-heading">
          <h2>不带咒刃</h2>
          <span>一人一套 · 按英雄直接查表</span>
        </div>
        <div class="lol-assassin-grid">
          <article v-for="build in guide.customBuilds" :key="build.id" class="lol-assassin-card">
            <header>
              <img :src="build.champion.icon" :alt="build.champion.name" loading="lazy">
              <div>
                <h3>{{ build.champion.name }}</h3>
                <p>{{ build.note }}</p>
              </div>
            </header>
            <div class="lol-assassin-line">
              <span>出门</span>
              <div class="lol-picks lol-assassin-picks">
                <figure v-for="item in build.starter" :key="item.name" class="lol-pick lol-pick-starter">
                  <img :src="item.icon" :alt="item.name" loading="lazy">
                  <figcaption>{{ item.name }}</figcaption>
                </figure>
              </div>
            </div>
            <div class="lol-assassin-line">
              <span>神装</span>
              <div class="lol-picks lol-assassin-picks">
                <figure v-for="item in build.items" :key="item.name" class="lol-pick">
                  <img :src="item.icon" :alt="item.name" loading="lazy">
                  <figcaption>{{ item.name }}</figcaption>
                </figure>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="lol-rules lol-assassin-rules">
        <h2>快速规则</h2>
        <ul>
          <li v-for="rule in guide.quickRules" :key="rule">{{ rule }}</li>
        </ul>
      </section>
    </div>
  `
};

const LolView = {
  components: { LolMageGuide, LolAdcGuide, LolAssassinGuide },
  template: `
    <div class="lol-view">
      <div class="lol-data-link">
        <a href="https://www.resg.top/" target="_blank" rel="noopener">
          <span class="lol-data-link-icon">📊</span>
          <span class="lol-data-link-text">海克斯大乱斗数据站 RESG</span>
          <span class="lol-data-link-arrow">↗</span>
        </a>
      </div>
      <nav class="lol-guide-switcher" aria-label="英雄联盟攻略切换">
        <button
          v-for="item in guides"
          :key="item.id"
          :class="{ active: activeGuide === item.id }"
          @click="activeGuide = item.id"
        >
          <span>{{ item.eyebrow }}</span>
          <strong>{{ item.label }}</strong>
        </button>
      </nav>
      <lol-mage-guide v-if="activeGuide === 'mage'" :guide="mageGuide"></lol-mage-guide>
      <lol-adc-guide v-else-if="activeGuide === 'adc'" :guide="adcGuide"></lol-adc-guide>
      <lol-assassin-guide v-else :guide="assassinGuide"></lol-assassin-guide>
    </div>
  `,
  data() {
    return {
      activeGuide: 'mage',
      mageGuide: lolMageGuideData,
      adcGuide: lolAdcGuideData,
      assassinGuide: lolAssassinGuideData,
      guides: [
        { id: 'mage', eyebrow: 'AP', label: '法师公式 3.0' },
        { id: 'adc', eyebrow: 'ADC', label: 'ADC 公式 4.0' },
        { id: 'assassin', eyebrow: 'AP', label: 'AP 刺客 3.0' }
      ]
    };
  }
};


/* ─── Route Table ─── */

const RouteTable = {
  template: `
    <div class="route-table">
      <div class="route-search">
        <input
          v-model="query"
          type="text"
          placeholder="搜索路由..."
        />
      </div>
      <div v-if="filteredCategories.length === 0" class="empty-state">没有匹配的路由</div>
      <div
        v-for="cat in filteredCategories"
        :key="cat.title"
        class="check-section"
        :class="{ open: cat.open }"
      >
        <div class="section-header" @click="cat.open = !cat.open">
          <div class="section-header-left">
            <h2>{{ cat.title }}</h2>
          </div>
          <div class="section-header-right">
            <span class="section-count">{{ cat.filteredItems.length }}</span>
            <span class="section-arrow">▸</span>
          </div>
        </div>
        <div class="section-body" v-show="cat.open">
          <div class="route-grid">
            <template v-for="item in cat.filteredItems" :key="item.name">
              <a v-if="item.url" :href="item.url" target="_blank" class="route-card">
                <div class="route-card-name">{{ item.name }}</div>
                <div v-if="item.desc" class="route-card-desc">{{ item.desc }}</div>
              </a>
              <div v-else class="route-card">
                <div class="route-card-name">{{ item.name }}</div>
                <div v-if="item.desc" class="route-card-desc">{{ item.desc }}</div>
                <code v-if="item.path" class="route-card-path">{{ item.path }}</code>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      query: '',
      categories: routeCategories.map(cat => ({ ...cat, open: true, filteredItems: cat.items }))
    };
  },
  computed: {
    filteredCategories() {
      const q = this.query.trim().toLowerCase();
      if (!q) {
        return this.categories;
      }
      return routeCategories
        .map(cat => ({
          ...cat,
          filteredItems: cat.items.filter(item =>
            item.name.toLowerCase().includes(q) ||
            (item.desc && item.desc.toLowerCase().includes(q))
          )
        }))
        .filter(cat => cat.filteredItems.length > 0);
    }
  }
};


/* ─── Membership View ─── */

const MembershipView = {
  template: `
    <div class="membership-view">
      <div class="membership-filter-grid">
        <button
          class="membership-filter-card"
          :class="{ active: group === 'active' }"
          @click="group = 'active'"
        >
          <div class="mfc-label">未过期</div>
          <div class="mfc-amount">月均 ¥{{ activeMonthlyTotal }}</div>
        </button>
        <button
          class="membership-filter-card"
          :class="{ active: group === 'expired' }"
          @click="group = 'expired'"
        >
          <div class="mfc-label">已过期</div>
        </button>
      </div>

      <div class="route-search">
        <input v-model="query" type="text" placeholder="搜索会员名或标签..." />
      </div>

      <div v-if="!groupedByTag.length" class="empty-state">无匹配记录</div>

      <div
        v-for="cat in groupedByTag"
        :key="cat.tag"
        class="check-section"
        :class="{ open: isTagOpen(cat.tag) }"
      >
        <div class="section-header" @click="toggleTag(cat.tag)">
          <div class="section-header-left">
            <h2>{{ cat.tag }}</h2>
          </div>
          <div class="section-header-right">
            <span class="section-count">{{ cat.records.length }}</span>
            <span class="section-arrow">▸</span>
          </div>
        </div>
        <div class="section-body" v-show="isTagOpen(cat.tag)">
          <div class="table-wrap">
            <table class="membership-table">
              <thead>
                <tr>
                  <th>会员名称</th>
                  <th>到期时间</th>
                  <th>剩余天数</th>
                  <th>价格</th>
                  <th>标签</th>
                  <th>备注</th>
                  <th>链接</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in cat.records"
                  :key="r.name"
                  :class="{ 'row-unknown': !r.expireDate }"
                >
                  <td class="mt-name">{{ r.name }}</td>
                  <td>{{ r.expireDate || '未知' }}</td>
                  <td :class="daysClass(r)">{{ formatDays(r) }}</td>
                  <td>{{ r.price != null ? '¥' + Math.round(r.price) : '—' }}</td>
                  <td>
                    <span v-for="t in r.tags" :key="t" class="membership-tag">{{ t }}</span>
                  </td>
                  <td class="mt-note" :title="r.note">{{ r.note }}</td>
                  <td>
                    <a v-if="r.url" :href="r.url" target="_blank" rel="noopener" class="mt-link">↗</a>
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      group: 'active',
      query: '',
      openTags: {},
      todayMs: today.getTime()
    };
  },
  computed: {
    expiredRecords() {
      return membershipRecords
        .filter(r => r.expireDate && this.parseDate(r.expireDate) < this.todayMs)
        .sort((a, b) => this.parseDate(b.expireDate) - this.parseDate(a.expireDate));
    },
    activeRecords() {
      return membershipRecords
        .filter(r => {
          if (!r.expireDate) return false;
          return this.parseDate(r.expireDate) >= this.todayMs;
        })
        .sort((a, b) => {
          if (!a.expireDate && !b.expireDate) return a.name.localeCompare(b.name, 'zh-CN');
          if (!a.expireDate) return 1;
          if (!b.expireDate) return -1;
          return this.parseDate(a.expireDate) - this.parseDate(b.expireDate);
        });
    },
    currentGroupRecords() {
      const base = this.group === 'active' ? this.activeRecords : this.expiredRecords;
      const q = this.query.trim().toLowerCase();
      if (!q) return base;
      return base.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    },
    groupedByTag() {
      const map = {};
      for (const r of this.currentGroupRecords) {
        const tag = (r.tags && r.tags[0]) || '其他';
        if (!map[tag]) map[tag] = [];
        map[tag].push(r);
      }
      return Object.entries(map)
        .map(([tag, records]) => ({ tag, records }))
        .sort((a, b) => b.records.length - a.records.length || a.tag.localeCompare(b.tag, 'zh-CN'));
    },
    activeMonthlyTotal() {
      const total = this.activeRecords.reduce((s, r) => {
        if (r.price == null || !r.cycleMonths) return s;
        return s + r.price / r.cycleMonths;
      }, 0);
      return Math.round(total);
    }
  },
  methods: {
    parseDate(s) {
      return new Date(s + 'T00:00:00').getTime();
    },
    daysClass(r) {
      if (!r.expireDate) return 'days-unknown';
      const diff = this.parseDate(r.expireDate) - this.todayMs;
      if (diff < 0) return 'days-expired';
      if (diff <= 30 * 86400000) return 'days-warning';
      return 'days-ok';
    },
    formatDays(r) {
      if (!r.expireDate) return '未知';
      const diff = Math.round((this.parseDate(r.expireDate) - this.todayMs) / 86400000);
      if (diff < 0) return `已过期 ${-diff} 天`;
      return `${diff} 天`;
    },
    isTagOpen(tag) {
      return this.openTags[tag] !== false;
    },
    toggleTag(tag) {
      this.openTags[tag] = !this.isTagOpen(tag);
    }
  }
};

/* ─── App ─── */

const app = createApp({
  data() {
    return {
      tabs: [
        { id: 'routes', title: '路由表', icon: '🗺️' },
        { id: 'valorant', title: '无畏契约', icon: '🎯' },
        { id: 'lol', title: '英雄联盟', icon: '⚔️' },
        { id: 'membership', title: '会员订阅', icon: '💳' }
      ],
      activeTab: 'routes',
      sidebarOpen: false
    };
  },
  methods: {
    switchTab(id) {
      this.activeTab = id;
      if (window.innerWidth < 720) this.sidebarOpen = false;
    }
  },
  watch: {
    sidebarOpen(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  },
  mounted() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.sidebarOpen = false;
    });
  }
});

app.component('route-table', RouteTable);
app.component('valorant-view', ValorantView);
app.component('lol-view', LolView);
app.component('membership-view', MembershipView);
app.mount('#app');
