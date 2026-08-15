import { getCollection } from 'astro:content';

export type Kind = 'experiment' | 'atlas' | 'observation' | 'reading' | 'lab';

export interface Entry {
  kind: Kind;
  kindLabel: string;
  kindLabelZh: string;
  title: string;
  titleZh: string;
  href: string;
  date: Date;
  lang: string;
}

/* One flat, purely chronological stream. Used by /index, /notes and the
   Recent block on the home page. No ranking, no "featured", no popularity —
   there is nothing here that could be ranked, by design (§1). */
export async function allEntries(): Promise<Entry[]> {
  const [experiments, atlas, observations, readings, labNotes] =
    await Promise.all([
      getCollection('experiments'),
      getCollection('atlas'),
      getCollection('observations'),
      getCollection('readings'),
      getCollection('lab-notes'),
    ]);

  const entries: Entry[] = [
    ...experiments.map((e) => ({
      kind: 'experiment' as const,
      kindLabel: 'experiment',
      kindLabelZh: '实验',
      title: e.data.title,
      titleZh: (e.data as any).titleZh ?? e.data.title,
      href: `/experiments/${e.id}/`,
      date: e.data.date,
      lang: (e.data as any).lang ?? 'en',
    })),
    ...atlas.map((e) => ({
      kind: 'atlas' as const,
      kindLabel: 'atlas',
      kindLabelZh: '田野',
      title: e.data.title,
      titleZh: (e.data as any).titleZh ?? e.data.title,
      href: `/atlas/${e.id}/`,
      date: e.data.date,
      lang: (e.data as any).lang ?? 'en',
    })),
    ...observations.map((e) => ({
      kind: 'observation' as const,
      kindLabel: 'observation',
      kindLabelZh: '观察',
      title: e.data.title,
      titleZh: (e.data as any).titleZh ?? e.data.title,
      href: `/notes/${e.id}/`,
      date: e.data.date,
      lang: (e.data as any).lang ?? 'en',
    })),
    ...readings.map((e) => ({
      kind: 'reading' as const,
      kindLabel: 'reading',
      kindLabelZh: '阅读',
      title: e.data.title,
      titleZh: (e.data as any).titleZh ?? e.data.title,
      href: `/notes/${e.id}/`,
      date: e.data.date,
      lang: (e.data as any).lang ?? 'en',
    })),
    ...labNotes.map((e) => ({
      kind: 'lab' as const,
      kindLabel: 'lab note',
      kindLabelZh: '实验室笔记',
      title: e.data.title,
      titleZh: (e.data as any).titleZh ?? e.data.title,
      href: `/notes/${e.id}/`,
      date: e.data.date,
      lang: (e.data as any).lang ?? 'en',
    })),
  ];

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}
