export const SITE = {
  title: 'TAO Garden',
  definition: 'An evolving research practice.',
  author: 'TAO',
  email: 'taotaoishare@gmail.com',
  /* The current question is expected to change. That it changes is itself
     a research finding (§2.2) — so it lives in one place, as data. */
  currentQuestion: {
    en: 'How might environments help humans cultivate attention and presence in the age of AI?',
    zh: '环境能否帮助人在人工智能的时代培养注意力与在场？',
  },
  /* The threshold, in three descending steps: what the practice is called,
     what it does, and the human question underneath.

     The largest human question leads. Where the knowledge comes from —
     gardens, ritual, craft, contemplative traditions — is stated further down
     the page, as a *source of knowledge* rather than as a style. Leading with
     it would file this under contemplative design, which is narrower than the
     work actually is. */
  tagline: {
    en: 'Human flourishing × Culture × Embodiment × Responsive technology',
    zh: '人的丰盛 × 文化 × 具身 × 响应式技术',
  },
  thresholdLead: {
    en: 'Designing responsive environments for human flourishing.',
    zh: '为人的丰盛，设计会回应的环境。',
  },
  thresholdQuestion: {
    en: 'Why do humans suffer? How might technology help us live with greater presence, awareness, and connection?',
    zh: '人为什么受苦——技术能否帮助我们以更多的在场、觉察与连接去生活？',
  },
  definition: {
    en: 'TAO Garden is an evolving research practice exploring how culture, embodied interaction, and responsive environments can create conditions for human flourishing.',
    zh: 'TAO Garden 是一个持续演化的研究实践，探索文化、具身交互与响应式环境如何为人的丰盛创造条件。',
  },

  /* Three pieces to start with. A chosen entry point is not a ranking: there
     is no ordering by popularity here because nothing is counted. The full
     set stays purely chronological at /experiments and /index. */
  /* The first one leads and runs full width; the rest share the second row. */
  homeExperiments: [
    'guqin-forest',
    'cosmic-pottery',
    'sadhana-pagoda',
    'phoenix-crown',
  ],
};

export function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function longDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function year(date: Date): string {
  return String(date.getFullYear());
}
