# 熊窝 · 个人主页

`https://thebear617.github.io/bear-home/`

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | **Astro**（静态构建） + Vue 3（目前仅无畏契约页面保留运行时） |
| 样式 | 暖色调设计 token（米黄 `#f7f3ee` + 深棕 `#2f2924` 侧栏），同 home/、cats/ |
| 构建 | Astro 输出 `dist/`，GitHub Pages 部署构建产物 |

## 架构

```
personal/
├── astro.config.mjs        # Astro 静态构建配置
├── package.json            # Astro 构建脚本与依赖
├── src/pages/
│   ├── index.astro         # 个人主页入口
│   └── valorant/index.astro # 无畏契约页面入口
├── public/                 # 静态资源与少量过渡交互脚本
│   ├── css/style.css
│   ├── js/vendor/          # 无畏契约过渡页使用的 Vue / marked 运行时
│   ├── valorant/
│   └── assets/
├── src/components/         # Astro 页面组件
├── src/data/               # Astro 数据模块
└── dist/                   # Astro 构建产物（不提交）
```

> 注：原「每日日历追踪 / 支出记录」Tab（Obsidian 日记 → `diary-data.js` / `expense-data.js` 的自动编译链路）已于 2026-07-11 迁移至 home 站点（`js/expense-data.js` + `js/diary-data.js` + 「每日追踪」Tab），personal 侧相关文件与组件已移除。

> 原「个人开发时间线」已迁移至 DevNotes 的「开发时间线」，personal 侧旧 Tab、数据和同步脚本均已移除。时间线 hook 与同步工具由 `devnotes/scripts/` 统一维护。

## 本地运行

```bash
npm install
npm run dev
# 打开 Astro 输出的本地地址
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
```

## 添加内容

- **日记**：在 Obsidian 中写 `YYYY-MM-DD.md`，Day planner 段落每行格式：

  ```
  - [x] #task HH:MM - HH:MM 描述 ⏳ YYYY-MM-DD #area/xxx
  ```

  commit 时自动同步到网站上。

- **手动记录**：在 `js/data.js` 的 `manualRecords` 中添加日期条目，手动记录会覆盖同日的日记数据。

- **路由表**：在 `src/data/site.js` 的 `routeCategories` 中添加条目。
- **英雄联盟**：当前页面入口已是 `/lol/`，由 `src/components/LolView.astro` 及三个攻略组件渲染；数据模块位于 `src/data/lol.js`。
- **无畏契约**：进入 `src/pages/valorant/index.astro` 对应的 `/valorant/` 页面；数据与交互脚本位于 `public/valorant/`。
