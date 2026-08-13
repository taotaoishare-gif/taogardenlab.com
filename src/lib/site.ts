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
  /* The threshold question. Note the grammar: it names what the practice is
     *trying to do*, not something it has achieved. The distinction is the
     whole reason the line beneath it exists — no physiological evaluation has
     been conducted here, and the site says so wherever the claim appears. */
  thresholdQuestion: {
    en: 'How to translate ancient contemplative wisdom into an immersive and responsive space to regulate the human autonomic nervous system.',
    zh: '如何将古老的沉思智慧，转译为能够调节人类自主神经系统的沉浸式交互空间。',
  },
  thresholdStatus: {
    en: 'The aim of the practice. Stated as a direction, not a result — nothing here has been physiologically evaluated.',
    zh: '这是实践的方向，不是结论——本站没有任何内容做过生理评估。',
  },
  definition: {
    en: 'An evolving research practice exploring the relationship between humans, intelligent environments, nature, and culture.',
    zh: '一个持续生长的研究实践，探索人、智能环境、自然与文化之间的关系。',
  },

  /* Three pieces to start with. A chosen entry point is not a ranking: there
     is no ordering by popularity here because nothing is counted. The full
     set stays purely chronological at /experiments and /index. */
  /* The first one leads and runs full width; the rest share the second row. */
  homeExperiments: ['guqin-forest', 'cosmic-pottery', 'sadhana-pagoda'],
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
