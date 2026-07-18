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
├── css/style.css           # 单一样式表
├── js/
│   ├── vendor/vue.global.prod.js   # Vue 3 自托管（164KB）
│   ├── data.js             # 静态数据：路由表、会员记录等
│   ├── todo-data.js        # 每日看板分类与任务数据
│   ├── valorant-data.js    # 无畏契约攻略数据
│   ├── lol-data.js         # 英雄联盟法师 / ADC / AP 刺客出装公式数据
│   ├── components/
│   │   └── TodoBoard.js    # 每日看板 Vue 组件
│   └── app.js              # Vue 应用：各 Tab 的组件与交互
├── assets/lol/             # 英雄联盟装备图标与英雄头像（站内本地资源）
└── scripts/
    └── install-hooks.sh    # 安装 Git 钩子
```

> 注：原「每日日历追踪 / 支出记录」Tab（Obsidian 日记 → `diary-data.js` / `expense-data.js` 的自动编译链路）已于 2026-07-11 迁移至 home 站点（`js/expense-data.js` + `js/diary-data.js` + 「每日追踪」Tab），personal 侧相关文件与组件已移除。

## 本地运行

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 部署

```bash
git add . && git commit -m "chore: 更新" && git push origin main
```

`install-hooks.sh` 会安装项目的 Git 钩子（如有）。

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
- **英雄联盟**：在 `js/lol-data.js` 中维护法师 / ADC / AP 刺客三个攻略视图的公式、条件分支、装备、英雄和快速规则；图片放在 `assets/lol/`。
- **每日看板**：在 `js/todo-data.js` 的 `TODO_BOARDS` 中维护视频、科研、编程、生活四类任务；状态使用 `todo`、`doing`、`done`。
- **会员订阅**：在 `js/data.js` 的 `membershipRecords` 数组中按 `{ name, expireDate, price, tags, note, source, url }` schema 添加条目；`expireDate` 留空视为"未知到期"。组件按 `expireDate < 今日` 自动划分"已过期 / 未过期"两组。
