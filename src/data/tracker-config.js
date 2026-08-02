// 追踪看板中需要跨源码、localStorage 和发布快照保持一致的目标配置。
// 目标金额发生变化时，只修改这里，再运行 tracker:migrate。
export const trackerGoalDefinitions = [
  {
    id: 'money-to-save',
    title: '我要攒的钱',
    label: 'Money to save',
    type: 'money',
    icon: '💰',
    current: 0,
    target: 13028,
    unit: '¥',
    status: 'active',
  },
  {
    id: 'money-owed-to-me',
    title: '别人还没还我的钱',
    label: 'Money owed to me',
    type: 'money',
    icon: '↩',
    current: 1000,
    target: 4350,
    unit: '¥',
    status: 'active',
  },
  {
    id: 'money-i-owe',
    title: '我要还别人的钱',
    label: 'Money I owe',
    type: 'money',
    icon: '📤',
    current: 0,
    target: 1184.88,
    unit: '¥',
    status: 'active',
  },
];

const goalDefinitionsById = new Map(trackerGoalDefinitions.map((goal) => [goal.id, goal]));

/**
 * 将旧 localStorage 或旧发布快照中的已知目标迁移到当前配置。
 *
 * current / status / startedAt / completedAt 属于运行数据，应当保留；
 * target 等配置字段由当前定义覆盖，避免旧目标金额继续传播。
 */
export function normalizeLongTermGoals(goals = [], fallbackStartedAt = null) {
  const normalized = [];
  const seenKnownIds = new Set();

  for (const goal of Array.isArray(goals) ? goals : []) {
    if (!goal || typeof goal !== 'object') continue;

    const definition = goalDefinitionsById.get(goal.id);
    if (!definition) {
      normalized.push(goal);
      continue;
    }
    if (seenKnownIds.has(goal.id)) continue;
    seenKnownIds.add(goal.id);

    normalized.push({
      ...definition,
      ...goal,
      title: definition.title,
      label: definition.label,
      type: definition.type,
      icon: definition.icon,
      unit: definition.unit,
      target: definition.target,
      current: goal.current ?? definition.current,
      status: goal.status ?? definition.status,
      startedAt: goal.startedAt ?? fallbackStartedAt,
      completedAt: Object.prototype.hasOwnProperty.call(goal, 'completedAt') ? goal.completedAt : null,
    });
  }

  for (const definition of trackerGoalDefinitions) {
    if (seenKnownIds.has(definition.id)) continue;
    normalized.push({
      ...definition,
      startedAt: fallbackStartedAt,
      completedAt: null,
    });
  }

  return normalized;
}

export function normalizeLongTermState(longTerm = {}, fallbackStartedAt = null) {
  const source = longTerm && typeof longTerm === 'object' ? longTerm : {};
  return {
    ...source,
    goals: normalizeLongTermGoals(source.goals, fallbackStartedAt),
  };
}
