// 追踪看板中需要跨源码、localStorage 和发布快照保持一致的目标配置。
// 目标金额发生变化时，只修改这里，再运行 tracker:migrate。
export const trackerGoalDefinitions = [
  {
    id: 'money-to-save',
    title: '我要攒的钱',
    label: 'Money to save',
    type: 'money',
    icon: '💰',
    progressLabel: '已攒',
    progressLabelEn: 'Saved',
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
    progressLabel: '已收',
    progressLabelEn: 'Collected',
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
    progressLabel: '已还',
    progressLabelEn: 'Repaid',
    current: 0,
    target: 1184.88,
    unit: '¥',
    status: 'active',
  },
  {
    // 博士毕业要求（《西安电子科技大学研究生必修环节实施细则》）：
    // 在学期间参加学术（技术）报告/论坛不少于 10 次。
    id: 'academic-reports',
    title: '学术报告 / 论坛',
    label: 'Academic reports & forums',
    type: 'count',
    icon: '📣',
    progressLabel: '已参加',
    progressLabelEn: 'Attended',
    current: 0,
    target: 10,
    unit: '',
    status: 'active',
  },
  {
    // 子集目标：其中在国内外学术（技术）会议或论坛上做口头报告不少于 3 次。
    // 做口头报告时两个目标都要 +1。
    id: 'academic-oral',
    title: '其中 · 口头报告',
    label: 'Oral presentations',
    type: 'count',
    icon: '🎤',
    progressLabel: '已完成',
    progressLabelEn: 'Presented',
    current: 0,
    target: 3,
    unit: '',
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
