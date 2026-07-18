// js/components/TodoBoard.js
// Todo 看板 Vue 3 组件。
// 完整功能分阶段实现，本任务只搭骨架：注册组件 + 显示标题 + "未加载"占位。
(function () {
  if (typeof Vue === 'undefined') {
    console.error('[TodoBoard] Vue 未加载。检查脚本顺序：vue.global.prod.js 必须在 todo-data.js 与 TodoBoard.js 之前加载。');
    return;
  }

  const TodoBoard = {
    template: `
      <div class="todo-board">
        <header class="todo-board-header">
          <div class="todo-board-date">
            <span class="todo-board-date-icon">📅</span>
            <span class="todo-board-date-text">{{ todayText }}</span>
          </div>
          <button
            class="todo-board-history-toggle"
            type="button"
            @click="historyOpen = !historyOpen"
          >
            📜 查看历史 {{ historyOpen ? '▴' : '▾' }}
          </button>
        </header>

        <nav class="todo-board-tabs" aria-label="看板分类">
          <button
            v-for="board in boards"
            :key="board.id"
            type="button"
            class="todo-board-tab"
            :class="{ active: activeTabId === board.id }"
            @click="activeTabId = board.id"
          >
            <span class="todo-board-tab-icon">{{ board.icon }}</span>
            <span class="todo-board-tab-name">{{ board.name }}</span>
          </button>
        </nav>

        <div v-if="!boardsLoaded" class="todo-board-empty">
          看板数据未加载。请检查 js/todo-data.js 是否在 TodoBoard.js 之前加载。
        </div>
        <div v-else-if="activeBoard" class="todo-board-columns">
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-todo">
              <span class="todo-board-column-dot"></span>
              待办 <span class="todo-board-column-count">{{ todoItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="todoItems.length === 0" class="todo-board-empty">还没有 todo</p>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-doing">
              <span class="todo-board-column-dot"></span>
              进行中 <span class="todo-board-column-count">{{ doingItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doingItems.length === 0" class="todo-board-empty">还没有进行中</p>
            </div>
          </div>
          <div class="todo-board-column">
            <div class="todo-board-column-header todo-status-done">
              <span class="todo-board-column-dot"></span>
              已完成 <span class="todo-board-column-count">{{ doneItems.length }}</span>
            </div>
            <div class="todo-board-column-body">
              <p v-if="doneItems.length === 0" class="todo-board-empty">还没有完成</p>
            </div>
          </div>
        </div>
      </div>
    `,
    data() {
      return {
        activeTabId: 'video',
        historyOpen: false
      };
    },
    computed: {
      boardsLoaded() {
        return typeof TODO_BOARDS !== 'undefined' && Array.isArray(TODO_BOARDS);
      },
      boards() {
        return this.boardsLoaded ? TODO_BOARDS : [];
      },
      dateKey() {
        // 单一日期源：YYYY-MM-DD
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      },
      todayText() {
        return `${this.dateKey}（今天）`;
      },
      todayStr() {
        return this.dateKey;
      },
      activeBoard() {
        return this.boards.find(b => b.id === this.activeTabId) || null;
      },
      allItems() {
        return this.activeBoard ? (this.activeBoard.items || []) : [];
      },
      byStatusToday(status) {
        // 工厂：按 status + 当天日期过滤
        return this.allItems.filter(it => {
          const s = it.status || 'todo';
          const d = it.date || this.dateKey;
          return s === status && d === this.dateKey;
        });
      },
      todoItems() {
        return this.byStatusToday('todo');
      },
      doingItems() {
        // 进行中：仅按 status，不过滤日期（跨天允许）
        return this.allItems.filter(it => (it.status || 'todo') === 'doing');
      },
      doneItems() {
        return this.byStatusToday('done');
      }
    }
  };

  // 暴露到全局，供 app.js 注册
  window.TodoBoard = TodoBoard;
})();