---
name: valorant-render
description: 当用户要求修改无畏契约页面的 markdown 渲染、修复战术条目排版、或编辑 app.js 中的 preprocessObsidian / buildCallout / loadContent 逻辑时触发。
---

# Skill: valorant-render

无畏契约（Valorant）战术笔记页面的 Markdown → HTML 渲染规则与约束。

## 触发场景

- 用户说"无畏契约渲染有问题"、"战术条目排版坏了"、"callout 显示不正常"
- 用户要求修改 `app.js` 中的 Obsidian 预处理逻辑
- 用户要求修改 `style.css` 中的 `.callout` 样式
- 用户要求修改 `valorant-data.js` 中的 markdown 数据格式

## 数据文件

| 文件 | 作用 |
|------|------|
| `js/valorant-data.js` | 单变量 `valorantMapMd`（双引号 JS 字符串，`\n` 转义换行） |
| `js/app.js` | `preprocessObsidian()` + `buildCallout()` + `ValorantView` 组件 |
| `js/vendor/marked.min.js` | marked.js 渲染引擎（已配置 `target="_blank"` link renderer） |
| `css/style.css` | `.callout`、`.valorant-body`、`.vmap-*` 样式（L1119–L1414） |

## Markdown 结构

```
# 无畏契约（Valorant）领域地图        ← H1 页面标题（渲染时被移除）
## 元认知                              ← H2 → H1（地图级 section）
## 全地图总表                          ← H2 → H1（与元认知合并为"概述"section）
## 亚海悬城                            ← H2 → H1
### 进攻思路                           ← H3 → H2（sub-section tab）
> [!note]- 进攻思路①：中路夹B         ← Obsidian Callout（折叠）
> - **核心逻辑**：...
> | 阶段 | 动作 |                      ← callout 内嵌表格
```

## 渲染管线（loadContent 方法）

```
valorantMapMd（原始 markdown）
  ↓ preprocessObsidian(md, markedFn)
  ↓   1. stripWikilinks：[[path|display]] → display
  ↓   2. 逐行扫描，提取 Obsidian callout（> [!type]-/+ title）
  ↓   3. callout 内容单独 marked.parse() → HTML
  ↓   4. 非 callout 部分用占位符 <div data-callout="N"> 替换
  ↓   5. 整体 marked.parse() 渲染剩余 markdown
  ↓   6. 占位符替换回 callout HTML
  ↓ 返回完整 HTML
  ↓
  ↓ 标题降级：移除第一个 H1，H2→H1，H3→H2
  ↓
  ↓ splitByHeading：按 H1 拆分为 sections
  ↓ 合并前两个 section（元认知 + 全地图总表）为"概述"
  ↓ splitSubSections：按 H2 拆分为 sub-section tabs
  ↓
  ↓ Vue v-html 渲染
```

## 核心约束

### 1. 禁止双重 marked.parse()

旧逻辑对 callout 内容执行一次 `marked.parse()`，再对整体（含 callout HTML）执行第二次 `marked.parse()`。这会导致 callout HTML 被包进 `<p>` 标签。

**正确做法**：用占位符 `<div data-callout="N">` 隔离 callout，只对非 callout 部分执行一次 `marked.parse()`，最后替换占位符。

### 2. 禁止在 callout 列表项之间插入空行

旧 `buildCallout` 在每行后插入空行（为了段落分隔），导致 marked.js 把每个 `<li>` 包裹成 `<li><p>...</p></li>`，列表项间距变成段落间距。

**正确做法**：callout 内容原样传给 `marked.parse()`，不插入任何额外空行。

### 3. callout HTML 结构

```html
<!-- 折叠（expand = '-'） -->
<details class="callout callout-{type}">
  <summary>{title}</summary>
  <div class="callout-body">{contentHtml}</div>
</details>

<!-- 展开（无 expand 或 '+'） -->
<div class="callout callout-{type}">
  <div class="callout-title">{title}</div>
  <div class="callout-body">{contentHtml}</div>
</div>
```

`<div class="callout-body">` 包裹内容，CSS 控制首尾 margin 归零。

### 4. callout 标题处理

- 去除 `（来源：...）` 和 `(来源：...)` 后缀
- `expand` 字符：`-` = 折叠（`<details>`），`+` 或无 = 展开（`<div>`）

### 5. 标题降级规则

| 原始 | 渲染后 | 用途 |
|------|--------|------|
| `# H1` | 移除第一个 | 页面标题不显示 |
| `## H2` | `<h1>` | 地图名 / section 标题 |
| `### H3` | `<h2>` | 进攻思路 / 防守 / 常见失误 / 零散观察 |

**注意**：callout 内部不含 `##` / `###` 标题（用 `**加粗**` 代替），所以 H2→H1、H3→H2 的字符串替换不会误伤 callout 内容。

### 6. CSS 关键样式

```css
/* callout 内容容器 */
.callout .callout-body > :first-child { margin-top: 0; }
.callout .callout-body > :last-child { margin-bottom: 0; }

/* 列表项内段落不额外加间距 */
.callout li > p { margin: 0; }

/* callout 类型配色 */
.callout-note    > :is(.callout-title, summary) { background: #eff6ff; color: #1d4ed8; }
.callout-warning > :is(.callout-title, summary) { background: #fffbeb; color: #b45309; }
.callout-tip     > :is(.callout-title, summary) { background: #ecfdf5; color: #047857; }
.callout-info    > :is(.callout-title, summary) { background: #f8fafc; color: #475569; }
```

## valorant-data.js 数据格式约束

### Callout 标题与正文必须分行

**错误**（标题和正文在同一行）：
```
> [!info]- 零散观察③：捷风防守A小扎B小> 捷风在深海明珠防守时站A小...
```

**正确**（标题和正文之间有换行）：
```
> [!info]- 零散观察③：捷风防守A小扎B小
> 捷风在深海明珠防守时站A小...
```

`preprocessObsidian` 的正则 `/^> \[!(\w+)\]([+-])?\s*(.*)/` 只捕获到行尾作为标题。如果正文跟在标题同一行的 `>` 后面，正文会被吞进标题。

### JS 字符串转义

`valorant-data.js` 中的 `valorantMapMd` 是双引号 JS 字符串：
- 换行 = `\n`（字面反斜杠 + n）
- 引号 = `\"`
- 反斜杠 = `\\`

编辑时注意：插入换行符要写 `\\n`（在文件中是两个字符 `\` + `n`），不是实际的换行。

## 验证方法

### 快速验证渲染结果

```bash
cd personal/
node -e "
const fs = require('fs');
const vm = require('vm');
const ctx = { console, window: {}, document: { createElement: () => ({}) } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/vendor/marked.min.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/valorant-data.js', 'utf8'), ctx);
const { marked } = ctx;
marked.use({ renderer: { link({ href, raw, tokens }) { if (!raw.startsWith('[')) return this.parser.parseInline(tokens); const text = this.parser.parseInline(tokens); return '<a href=\"'+href+'\" target=\"_blank\">'+text+'</a>'; } } });
// 提取 app.js 中的渲染函数
var src = fs.readFileSync('js/app.js', 'utf8');
var funcs = src.match(/function stripWikilinks[\s\S]*?return html;\n}/);
if (funcs) vm.runInContext(funcs[0], ctx);
var html = ctx.preprocessObsidian(ctx.valorantMapMd, function(md) { return marked.parse(md); });
console.log('Callouts:', (html.match(/<details/g) || []).length);
console.log('Tables:', (html.match(/<table/g) || []).length);
console.log('li<p>:', (html.match(/<li><p>/g) || []).length, '(should be low)');
console.log('li:', (html.match(/<li>(?!<p>)/g) || []).length, '(should be high)');
console.log('Raw **:', (html.match(/\*\*/g) || []).length, '(should be 0)');
console.log('Callouts in <p>:', (html.match(/<p><details/g) || []).length, '(should be 0)');
"
```

### 预期指标

| 指标 | 正常值 | 异常值 |
|------|--------|--------|
| `<details>` 数量 | ~59 | 0 = 数据未加载 |
| `<table>` 数量 | ~36 | 0 = 表格未渲染 |
| `<li><p>` 数量 | < 10 | > 200 = buildCallout 插了空行 |
| `<li>` (无 p) 数量 | > 250 | < 50 = 列表被段落包裹 |
| Raw `**` 数量 | 0 | > 0 = marked 未渲染加粗 |
| `<p><details>` 数量 | 0 | > 0 = 占位符未隔离 callout |

### 截图验证

```bash
cd personal/ && python3 -m http.server 8765 &
# 用 Chrome headless 截图（需手动切到无畏契约 tab）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot=/tmp/valorant.png --window-size=1200,4000 "http://localhost:8765/"
kill %1
```

## 常见问题排查

| 症状 | 原因 | 修复 |
|------|------|------|
| 列表项间距过大 | `buildCallout` 在列表项间插了空行 | 删除空行插入逻辑，内容原样传 marked |
| callout 被包在 `<p>` 里 | 占位符不是块级元素 | 用 `<div data-callout="N">` 作占位符 |
| 表格无边框 | CSS 未加载或选择器不匹配 | 检查 `.callout th, .callout td` border |
| 内容缺失（只有第一个 callout） | 第二次 marked.parse 破坏了 callout HTML | 改用占位符方案，只 parse 一次 |
| 标题吞了正文第一行 | data 中 callout 标题和正文在同一行 | 在标题后插入 `\n` |
