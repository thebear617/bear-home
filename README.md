# 熊窝 · 个人主页

`https://thebear617.github.io/bear-home/`

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | **Vue 3**（全局构建，自托管 `js/vendor/vue.global.prod.js`，不依赖 CDN） |
| 样式 | 暖色调设计 token（米黄 `#f7f3ee` + 深棕 `#2f2924` 侧栏），同 home/、cats/ |
| 构建 | **无**。纯静态 HTML + CSS + JS，零依赖 |

## 架构

```
personal/
├── index.html              # 入口，Vue 挂载点
├── _diary/                 # → Obsidian 日记目录（软链，gitignored）
├── css/style.css           # 单一样式表
├── js/
│   ├── vendor/vue.global.prod.js   # Vue 3 自托管（164KB）
│   ├── data.js             # 静态数据：路由表、手动记录
│   ├── diary-data.js       # 日记自动生成数据（提交到 git）
│   └── app.js              # Vue 应用：CalendarView + RouteTable 组件
└── scripts/
    ├── build-diary.py      # 解析 _diary/*.md 的 Day planner → diary-data.js
    ├── install-hooks.sh    # 安装 Git 钩子
    └── git-hooks/
        └── pre-commit      # 每次 commit 前自动跑 build-diary.py
```

## 数据链路

```
Obsidian 日记 (_notes/日记/*.md)
  ↓ 软链接 _diary/
  ↓ pre-commit hook 触发
scripts/build-diary.py
  ↓ 解析 Day planner 段落，提取时间段 + 任务描述
js/diary-data.js  (自动生成，const diaryRecords)
  ↓ 合并 manualRecords (data.js)
app.js → dailyRecords
  ↓ Vue 响应式渲染
日历视图
```

## 本地运行

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 部署

```bash
git add . && git commit -m "chore: 更新" && git push origin main
```

每次 `git commit` 时，pre-commit hook 会自动运行 `build-diary.py` 并暂存 `diary-data.js`。无需额外步骤。

## 新机器初始化

```bash
git clone https://github.com/thebear617/bear-home.git
cd bear-home
ln -s /Users/mokaiche/Documents/notes/日记 _diary
./scripts/install-hooks.sh
```

## 添加内容

- **日记**：在 Obsidian 中写 `YYYY-MM-DD.md`，Day planner 段落每行格式：

  ```
  - [x] #task HH:MM - HH:MM 描述 ⏳ YYYY-MM-DD #area/xxx
  ```

  commit 时自动同步到网站上。

- **手动记录**：在 `js/data.js` 的 `manualRecords` 中添加日期条目，手动记录会覆盖同日的日记数据。

- **路由表**：在 `js/data.js` 的 `routeCategories` 中添加条目。
- **会员订阅**：在 `js/data.js` 的 `membershipRecords` 数组中按 `{ name, expireDate, price, tags, note, source, url }` schema 添加条目；`expireDate` 留空视为"未知到期"。组件按 `expireDate < 今日` 自动划分"已过期 / 未过期"两组。
