/* The three domains, and the four-level question ladder. Both are read by the
   home page and by /research, so the site can never state them two ways.

   天 / 地 / 人 are the 三才 — the classical triad of Heaven, Earth and the
   Human that stands between them. Used here as an organising frame, not a
   metaphysical claim: each character keeps its own English name beside it, and
   the mapping is never argued for in prose. A framework that has to defend
   itself has stopped being a framework. */

export const DOMAINS = [
  {
    numeral: 'I',
    mark: '天',
    classical: { en: 'Heaven', zh: '天' },
    name: { en: 'Culture & contemplation', zh: '文化与沉思' },
    gloss: { en: 'What was inherited', zh: '所承者' },
    question: {
      en: 'How have humans historically cultivated attention, meaning, and ways of living?',
      zh: '人类在历史上如何培养注意力、意义与生活方式？',
    },
    keywords: [
      { en: 'Ritual as encoding', zh: '仪式作为编码' },
      { en: 'Chan aesthetics', zh: '禅宗美学' },
      { en: 'Garden phenomenology', zh: '园林空间现象学' },
    ],
    href: '/atlas',
  },
  {
    numeral: 'II',
    mark: '地',
    classical: { en: 'Earth', zh: '地' },
    name: { en: 'Intelligent environments', zh: '智能环境' },
    gloss: { en: 'What is built', zh: '所造者' },
    question: {
      en: 'What happens when environments become responsive and intelligent?',
      zh: '当环境开始回应、开始有智能，会发生什么？',
    },
    keywords: [
      { en: 'Vertex-shader particles', zh: '顶点着色器粒子' },
      { en: 'Spatial audio synthesis', zh: '空间音频合成' },
      { en: 'Vision & bio-signal input', zh: '视觉与生理信号输入' },
    ],
    href: '/experiments',
  },
  {
    numeral: 'III',
    mark: '人',
    classical: { en: 'Human', zh: '人' },
    name: { en: 'Human experience', zh: '人的经验' },
    gloss: { en: 'Who it is for', zh: '所为者' },
    question: {
      en: 'How might environments support richer forms of human experience?',
      zh: '环境能否支持更丰富的人类经验？',
    },
    keywords: [
      { en: 'Attention & presence', zh: '注意力与在场' },
      { en: 'Pace and resistance', zh: '节奏与阻力' },
      { en: 'Self-reported experience', zh: '自述经验' },
    ],
    href: '/notes',
  },
] as const;

/* The ladder descends. The existential question is the horizon, and it is set
   smallest and faintest on purpose — the thing that grows down the page is the
   thing that can actually be worked on this year. */
export const LADDER = [
  {
    level: { en: 'Existential', zh: '存在' },
    question: {
      en: 'Why do humans suffer?',
      zh: '人为什么受苦？',
    },
  },
  {
    level: { en: 'Human', zh: '人类' },
    question: {
      en: 'How have humans learned to live with suffering, uncertainty, and impermanence?',
      zh: '人类如何学会与苦难、不确定与无常共处？',
    },
  },
  {
    level: { en: 'Research', zh: '研究' },
    question: {
      en: 'How do environments shape attention and presence?',
      zh: '环境如何塑造注意力与在场？',
    },
  },
  {
    level: { en: 'Current design', zh: '当前设计' },
    question: {
      en: 'How might intelligent environments support attention and presence?',
      zh: '智能环境能否支持注意力与在场？',
    },
  },
] as const;
