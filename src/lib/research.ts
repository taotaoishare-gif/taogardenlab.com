/* The research architecture, as data.
   The home page and /research both read from here, so the argument can only
   ever be stated one way. Everything is bilingual at the field level. */

export type Bi = { en: string; zh: string };

/* ── 01 · The chain from the largest question down to something testable.
   It descends deliberately: the top is a horizon nobody can operationalise,
   the bottom is a thing that runs this week. */
export const RESEARCH_LOGIC: {
  level: Bi;
  statement: Bi;
  note?: Bi;
}[] = [
  {
    level: { en: 'Why', zh: '为何' },
    statement: { en: 'Why do humans suffer?', zh: '人为什么受苦？' },
    note: {
      en: 'An open question rather than a problem this project claims to solve.',
      zh: '一个敞开的问题，而不是本项目声称能解决的难题。',
    },
  },
  {
    level: { en: 'Purpose', zh: '目的' },
    statement: { en: 'Human flourishing', zh: '人的丰盛' },
    note: {
      en: 'Humans have long developed practices, rituals, arts and environments for living with uncertainty and impermanence.',
      zh: '长久以来，人类以实践、仪式、艺术与环境，来与不确定和无常共处。',
    },
  },
  {
    level: { en: 'Capacities', zh: '能力' },
    statement: {
      en: 'Presence · Awareness · Connection',
      zh: '在场 · 觉察 · 连接',
    },
  },
  {
    level: { en: 'Mechanism', zh: '机制' },
    statement: {
      en: 'Attention · Embodiment · Regulation',
      zh: '注意 · 具身 · 调节',
    },
  },
  {
    level: { en: 'Design', zh: '设计' },
    statement: { en: 'Responsive environments', zh: '响应式环境' },
  },
  {
    level: { en: 'Experiment', zh: '实验' },
    statement: {
      en: 'Prototype → Measure → Reflect',
      zh: '造原型 → 测量 → 反思',
    },
  },
];

/* The proposition the whole practice rests on. Stated as a proposition, not
   as a finding — nothing here has been demonstrated yet. */
export const PROPOSITION: Bi = {
  en: 'If environments can perceive and respond to embodied human states, they may stop being passive backdrops and become active participants in shaping attention, awareness and connection.',
  zh: '如果环境能够感知并回应人的具身状态，那么它或许不再只是被动的背景，而可能成为影响注意、觉察与连接的主动参与者。',
};

/* ── 02 · Three experiential constructs, and the mechanism that cuts across
   all three. */
export const CONSTRUCTS: {
  n: string;
  name: Bi;
  definition: Bi;
}[] = [
  {
    n: '01',
    name: { en: 'Presence', zh: '在场' },
    definition: {
      en: 'The capacity to return attention to the present.',
      zh: '把注意力带回当下的能力。',
    },
  },
  {
    n: '02',
    name: { en: 'Awareness', zh: '觉察' },
    definition: {
      en: "The capacity to perceive one's own bodily and experiential state.",
      zh: '觉知自身身体状态与经验状态的能力。',
    },
  },
  {
    n: '03',
    name: { en: 'Connection', zh: '连接' },
    definition: {
      en: 'The felt relationship between self, environment, others and culture.',
      zh: '自我与环境、他人及文化之间那种被感受到的关系。',
    },
  },
];

export const REGULATION: { name: Bi; question: Bi } = {
  name: { en: 'Regulation', zh: '调节' },
  question: {
    en: 'Can increased awareness and responsive feedback support moment-to-moment self-regulation?',
    zh: '增强的觉察与响应式反馈，能否支持当下时刻的自我调节？',
  },
};

export const FLOURISHING: { name: Bi; question: Bi } = {
  name: { en: 'Flourishing', zh: '丰盛' },
  question: {
    en: 'Could these capacities contribute to more flourishing ways of living?',
    zh: '这些能力能否让生活变得更丰盛？',
  },
};

/* ── 05 · The method, as eight moves rather than a paragraph. */
export const METHOD: { n: string; name: Bi; body: Bi }[] = [
  {
    n: '01',
    name: { en: 'Observe', zh: '观察' },
    body: {
      en: 'Human experience, cultural practices, environments',
      zh: '人的经验、文化实践、环境',
    },
  },
  {
    n: '02',
    name: { en: 'Question', zh: '提问' },
    body: {
      en: 'Form a specific research question',
      zh: '形成一个具体的研究问题',
    },
  },
  {
    n: '03',
    name: { en: 'Build', zh: '建造' },
    body: {
      en: 'Create a small responsive environment',
      zh: '造一个小的响应式环境',
    },
  },
  {
    n: '04',
    name: { en: 'Sense', zh: '感知' },
    body: {
      en: 'Capture bodily and behavioural signals',
      zh: '采集身体与行为信号',
    },
  },
  {
    n: '05',
    name: { en: 'Map', zh: '映射' },
    body: {
      en: 'Translate signals into environmental behaviour',
      zh: '把信号转译为环境的行为',
    },
  },
  {
    n: '06',
    name: { en: 'Test', zh: '测试' },
    body: {
      en: 'Compare experiences across conditions',
      zh: '在不同条件之间比较体验',
    },
  },
  {
    n: '07',
    name: { en: 'Reflect', zh: '反思' },
    body: {
      en: 'Interpret quantitative and qualitative evidence',
      zh: '解读定量与定性的证据',
    },
  },
  {
    n: '08',
    name: { en: 'Iterate', zh: '迭代' },
    body: { en: 'Generate the next question', zh: '生成下一个问题' },
  },
];

/* ── 05b / 06 · The three materials the work is made of. 天 / 地 / 人 is the
   organising frame; the English name leads and the character sits beside it. */
export const MATERIALS: {
  mark: string;
  name: Bi;
  role: Bi;
  items: Bi[];
}[] = [
  {
    mark: '天',
    name: { en: 'Culture', zh: '文化' },
    role: {
      en: 'gives the system its practices and meanings',
      zh: '为系统提供实践与意义',
    },
    items: [
      { en: 'garden', zh: '园林' },
      { en: 'ritual', zh: '仪式' },
      { en: 'craft', zh: '手艺' },
      { en: 'contemplative traditions', zh: '沉思传统' },
    ],
  },
  {
    mark: '人',
    name: { en: 'Embodiment', zh: '具身' },
    role: { en: 'gives it a human signal', zh: '为它提供来自人的信号' },
    items: [
      { en: 'body', zh: '身体' },
      { en: 'attention', zh: '注意' },
      { en: 'breath', zh: '呼吸' },
      { en: 'agency', zh: '能动' },
    ],
  },
  {
    mark: '地',
    name: { en: 'Computation', zh: '计算' },
    role: { en: 'makes the environment responsive', zh: '让环境能够回应' },
    items: [
      { en: 'sensing', zh: '感知' },
      { en: 'AI', zh: '人工智能' },
      { en: 'responsive systems', zh: '响应式系统' },
      { en: 'spatial computing', zh: '空间计算' },
    ],
  },
];

export const WHY_IT_MATTERS: { lead: Bi; turn: Bi; signature: Bi } = {
  lead: {
    en: 'Modern technology has become increasingly capable of helping humans optimise, accelerate and automate.',
    zh: '当代技术越来越擅长帮助人类优化、加速与自动化。',
  },
  turn: {
    en: 'TAO Garden asks a complementary question: can technology also help us slow down, notice, connect, and be?',
    zh: 'TAO Garden 想提出一个与之互补的问题：技术是否也能帮助我们慢下来、觉察、连接，并真正地存在？',
  },
  signature: {
    en: 'Technology should not only help humans do more. It should also help humans be.',
    zh: '技术不应只帮助人做得更多，也应帮助人存在。',
  },
};

/* ── 07 · Where this is going. Phase I is the only one currently underway;
   the rest are stated as direction, not as work in progress. */
export const TRAJECTORY: {
  phase: string;
  name: Bi;
  question: Bi;
  horizon: Bi;
  items: Bi;
}[] = [
  {
    phase: 'I',
    name: { en: 'Embodied awareness', zh: '具身觉察' },
    question: {
      en: 'How can environments make human states perceptible?',
      zh: '环境如何让人的状态变得可感知？',
    },
    horizon: { en: 'Current', zh: '当前' },
    items: {
      en: 'sensing · gesture · biofeedback · resistance',
      zh: '感知 · 手势 · 生物反馈 · 阻力',
    },
  },
  {
    phase: 'II',
    name: { en: 'Responsive environments', zh: '响应式环境' },
    question: {
      en: 'How can environments adapt to human states over time?',
      zh: '环境如何随时间适应人的状态？',
    },
    horizon: { en: 'Next', zh: '下一步' },
    items: {
      en: 'multimodal sensing · spatial computing · VR · adaptive systems',
      zh: '多模态感知 · 空间计算 · VR · 自适应系统',
    },
  },
  {
    phase: 'III',
    name: { en: 'Human flourishing', zh: '人的丰盛' },
    question: {
      en: 'How might technology support more aware, connected and flourishing ways of living?',
      zh: '技术如何支持更有觉察、更有连接、更丰盛的生活方式？',
    },
    horizon: { en: 'Long-term', zh: '长期' },
    items: {
      en: 'adaptive environments · AI · longitudinal interaction',
      zh: '自适应环境 · 人工智能 · 长期互动',
    },
  },
];

export const CROSS_CULTURAL: { name: Bi; question: Bi } = {
  name: { en: 'Cross-cultural inquiry', zh: '跨文化追问' },
  question: {
    en: 'What can different cultural traditions teach us about how environments cultivate attention, relationship and ways of living?',
    zh: '不同的文化传统，能教给我们什么关于环境如何培养注意力、关系与生活方式的东西？',
  },
};

/* ── 04 · The closed loop the current study runs on. Body to body. */
export const CLOSED_LOOP: { name: Bi; detail?: Bi }[] = [
  {
    name: { en: 'Body', zh: '身体' },
    detail: { en: 'respiration + ECG', zh: '呼吸 + 心电' },
  },
  {
    name: { en: 'Signal', zh: '信号' },
    detail: { en: 'respiration rate · RR · HRV', zh: '呼吸频率 · RR · HRV' },
  },
  {
    name: { en: 'Interpretation', zh: '解读' },
    detail: { en: 'state estimation', zh: '状态估计' },
  },
  {
    name: { en: 'Mapping', zh: '映射' },
    detail: {
      en: 'particle cohesion · light density · sound harmony',
      zh: '粒子聚合 · 光的疏密 · 声音和谐度',
    },
  },
  {
    name: { en: 'Environment', zh: '环境' },
    detail: { en: 'particles + sound', zh: '粒子 + 声音' },
  },
  {
    name: { en: 'Perception', zh: '知觉' },
    detail: { en: 'the sitter perceives their own state', zh: '打坐者感知到自己的状态' },
  },
];
