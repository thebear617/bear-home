# 熊窝 personal 更新日志

## v0.8.1 — 2026-07-13
feat: 路由表新增「常用链接」分类，会员订阅补充 ChatGPT Plus，修复备注列截断

- feat: 路由表 `routeCategories` 新增「🔗 常用链接」分类（LDXP 神秘小铺 / OpenTheRank / OpenRouter Rankings），置于「个人站点」之后
- feat: 会员订阅 `membershipRecords` 新增 ChatGPT Plus（到期 2026-08-12，¥25/月，备注登录账号）
- fix: 会员表 `.mt-note` 改为换行显示，备注不再被单行省略号截断

## v0.8.0 — 2026-07-11
refactor: 移除「日历」「记账」两个 Tab 及构建管线（大版本）

- refactor: 删除 CalendarView / ExpenseView 组件及注册
- refactor: 删除 calendar / expense 两个 Tab、expenseCategories / manualRecords / recordLabel / dailyRecords
- chore: 删除 js/diary-data.js、js/expense-data.js、scripts/* 构建管线与 pre-commit hook
- docs: README 同步说明每日追踪与支出记录已迁移至 home
- 注：home 新增「每日追踪」「支出记录」两个 Tab 承接全部功能（见 home v0.9.0）
