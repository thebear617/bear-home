export type RelationshipType = '家人' | '朋友' | '同学' | '合作伙伴' | '客户';
export type RelationshipStatus = '良好' | '普通' | '待维护';
export type InteractionType = '微信' | '电话' | '邮件' | '见面' | '其他';
export type LinkedTaskStatus = '待开始' | '进行中' | '已完成';
export type LinkedTaskType = '跟进任务' | '普通任务';

export interface Interaction {
  id: string;
  date: string;
  type: InteractionType;
  summary: string;
}

export interface LinkedTask {
  id: string;
  title: string;
  taskType: LinkedTaskType;
  status: LinkedTaskStatus;
  dueDate?: string;
  archived?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarTone: 'amber' | 'sage' | 'blue' | 'rose' | 'plum' | 'slate';
  createdAt?: string;
  organization?: string;
  role?: string;
  relationshipType: RelationshipType;
  tags: string[];
  phone?: string;
  email?: string;
  lastContactAt?: string;
  relationshipStatus: RelationshipStatus;
  notes: string;
  interactions: Interaction[];
  linkedTasks: LinkedTask[];
}

export const CRM_TODAY = '2026-09-11';
export const LONG_NO_CONTACT_DAYS = 45;

export const CRM_CONTACTS: Contact[] = [
  {
    id: 'lin-xiao',
    name: '林晓',
    initials: '林晓',
    avatarTone: 'amber',
    createdAt: '2026-08-28',
    role: '自由设计师',
    organization: '合作设计师',
    relationshipType: '合作伙伴',
    tags: ['合作伙伴', '猫猫项目'],
    phone: '138****2741',
    email: 'linxiao***@mail.com',
    lastContactAt: '2026-09-10',
    relationshipStatus: '待维护',
    notes: '很专业靠谱，审美在线，沟通顺畅。\n喜欢猫，家里有两只布偶。\n合作过两个项目，期待长期合作。',
    interactions: [
      { id: 'lin-i1', date: '2026-09-10', type: '微信', summary: '讨论了猫猫项目封面方案，确定了主色调方向。' },
      { id: 'lin-i2', date: '2026-09-09', type: '邮件', summary: '发送了初版设计稿和参考案例。' },
      { id: 'lin-i3', date: '2026-09-08', type: '电话', summary: '沟通项目进度和需求细节。' },
      { id: 'lin-i4', date: '2026-09-06', type: '见面', summary: '在咖啡馆见面，确认合作细节。' },
      { id: 'lin-i5', date: '2026-09-04', type: '微信', summary: '分享了灵感收集资料。' },
    ],
    linkedTasks: [
      { id: 'lin-followup', title: '跟进 林晓', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-11' },
      { id: 'lin-t1', title: '整理猫猫项目需求', taskType: '普通任务', status: '进行中', dueDate: '2026-09-12' },
      { id: 'lin-t2', title: '周五前发送参考图', taskType: '普通任务', status: '待开始', dueDate: '2026-09-13' },
      { id: 'lin-t3', title: '确认封面最终方案', taskType: '普通任务', status: '待开始', dueDate: '2026-09-16' },
    ],
  },
  {
    id: 'zhou-ning',
    name: '周宁',
    initials: '周宁',
    avatarTone: 'slate',
    createdAt: '2026-08-23',
    role: '大学同学',
    relationshipType: '同学',
    tags: ['大学同学'],
    phone: '139****1842',
    email: 'zhoun***@mail.com',
    lastContactAt: '2026-09-10',
    relationshipStatus: '普通',
    notes: '最近在准备秋招，偶尔交流学校和工作近况。',
    interactions: [
      { id: 'zhou-i1', date: '2026-09-10', type: '微信', summary: '聊了聊秋招和最近的生活安排。' },
    ],
    linkedTasks: [{ id: 'zhou-followup', title: '跟进 周宁', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-15' }],
  },
  {
    id: 'chen-a-yi',
    name: '陈阿姨',
    initials: '陈姨',
    avatarTone: 'sage',
    createdAt: '2026-08-18',
    role: '家人',
    relationshipType: '家人',
    tags: ['亲戚'],
    phone: '137****6208',
    email: 'chena***@mail.com',
    lastContactAt: '2026-09-09',
    relationshipStatus: '良好',
    notes: '关心家里的近况，喜欢分享家常菜和周末安排。',
    interactions: [
      { id: 'chen-i1', date: '2026-09-09', type: '电话', summary: '聊了家里的近况和周末回家的安排。' },
      { id: 'chen-i2', date: '2026-09-06', type: '微信', summary: '分享了最近做的新菜和周末安排。' },
    ],
    linkedTasks: [{ id: 'chen-followup', title: '跟进 陈阿姨', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-17' }],
  },
  {
    id: 'xu-dan',
    name: '许丹',
    initials: '许丹',
    avatarTone: 'blue',
    createdAt: '2026-08-14',
    role: '产品经理',
    organization: '星光工作室',
    relationshipType: '朋友',
    tags: ['朋友', '产品'],
    phone: '136****9015',
    email: 'xudan***@mail.com',
    lastContactAt: '2026-09-08',
    relationshipStatus: '待维护',
    notes: '最近在推进新产品，喜欢聊产品体验和工作方法。',
    interactions: [
      { id: 'xu-i1', date: '2026-09-08', type: '微信', summary: '聊了最近的产品进展和准备中的新功能。' },
    ],
    linkedTasks: [{ id: 'xu-followup', title: '跟进 许丹', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-11' }],
  },
  {
    id: 'tang-ke',
    name: '唐可',
    initials: '唐可',
    avatarTone: 'rose',
    createdAt: '2026-08-13',
    role: '青禾咖啡主理人',
    organization: '青禾咖啡',
    relationshipType: '客户',
    tags: ['客户', '咖啡'],
    phone: '135****4470',
    email: 'tangke***@mail.com',
    lastContactAt: '2026-09-07',
    relationshipStatus: '待维护',
    notes: '正在等待秋季联名方案反馈，沟通需要留出确认时间。',
    interactions: [
      { id: 'tang-i1', date: '2026-09-07', type: '邮件', summary: '发送了秋季联名方案和报价说明。' },
    ],
    linkedTasks: [{ id: 'tang-followup', title: '跟进 唐可', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-08' }],
  },
  {
    id: 'zhao-yi-fan',
    name: '赵一帆',
    initials: '赵帆',
    avatarTone: 'plum',
    role: '摄影合作',
    relationshipType: '朋友',
    tags: ['朋友', '摄影'],
    phone: '133****5186',
    email: 'zhaoy***@mail.com',
    lastContactAt: '2026-09-06',
    relationshipStatus: '待维护',
    notes: '很久没联系，可以问候一下最近的拍摄计划。',
    interactions: [
      { id: 'zhao-i1', date: '2026-09-06', type: '见面', summary: '聊过近期拍摄和合作安排。' },
    ],
    linkedTasks: [{ id: 'zhao-followup', title: '跟进 赵一帆', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-18' }],
  },
  {
    id: 'sun-yue',
    name: '孙悦',
    initials: '孙悦',
    avatarTone: 'rose',
    role: '产品设计师',
    organization: '远山设计',
    relationshipType: '合作伙伴',
    tags: ['合作伙伴', '设计'],
    phone: '132****3619',
    email: 'suny***@mail.com',
    lastContactAt: '2026-09-05',
    relationshipStatus: '普通',
    notes: '可以交流新功能页面和设计系统的实践。',
    interactions: [
      { id: 'sun-i1', date: '2026-09-05', type: '微信', summary: '确认了新功能页面的设计方向。' },
    ],
    linkedTasks: [{ id: 'sun-followup', title: '跟进 孙悦', taskType: '跟进任务', status: '待开始', dueDate: '2026-09-22' }],
  },
  {
    id: 'wang-lei',
    name: '王磊',
    initials: '王磊',
    avatarTone: 'slate',
    role: '大学室友',
    relationshipType: '同学',
    tags: ['大学同学'],
    phone: '131****7752',
    email: 'wangle***@mail.com',
    lastContactAt: '2026-07-20',
    relationshipStatus: '普通',
    notes: '偶尔约着见面，保持轻松联系。',
    interactions: [
      { id: 'wang-i1', date: '2026-08-05', type: '微信', summary: '约了下次见面和一起吃饭的时间。' },
    ],
    linkedTasks: [],
  },
];

function dateValue(value?: string): number {
  return value ? Date.parse(`${value}T12:00:00+08:00`) : Number.NaN;
}

export function dateDistance(from: string, to?: string): number | null {
  if (!to) return null;
  const difference = dateValue(to) - dateValue(from);
  return Number.isFinite(difference) ? Math.round(difference / 86400000) : null;
}

export function getNextFollowUpTask(contact: Contact): LinkedTask | undefined {
  return [...contact.linkedTasks]
    .filter((task) => task.taskType === '跟进任务' && task.status !== '已完成' && task.dueDate)
    .sort((first, second) => dateValue(first.dueDate) - dateValue(second.dueDate))[0];
}

export function getNextFollowUpAt(contact: Contact): string | undefined {
  return getNextFollowUpTask(contact)?.dueDate;
}

export function followupBucket(contact: Contact): 'today' | 'overdue' | 'next7' | 'none' {
  const distance = dateDistance(CRM_TODAY, getNextFollowUpAt(contact));
  if (distance === 0) return 'today';
  if (distance !== null && distance < 0) return 'overdue';
  if (distance !== null && distance <= 7) return 'next7';
  return 'none';
}

export function isLongNoContact(contact: Contact): boolean {
  const distance = dateDistance(contact.lastContactAt || CRM_TODAY, CRM_TODAY);
  return distance !== null && distance >= LONG_NO_CONTACT_DAYS;
}

export function getCrmStats(contacts: Contact[]) {
  return {
    total: contacts.length,
    today: contacts.filter((contact) => followupBucket(contact) === 'today').length,
    overdue: contacts.filter((contact) => followupBucket(contact) === 'overdue').length,
    weeklyInteractions: contacts.reduce((total, contact) => total + contact.interactions.filter((item) => dateDistance(item.date, CRM_TODAY) !== null && dateDistance(item.date, CRM_TODAY)! <= 7).length, 0),
  };
}
