import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------
   Adding research = adding one markdown file. Never touching code.
   `evidence` is required everywhere — not so it can be displayed, but
   so the author has to decide what kind of thing she is saying before
   she is allowed to publish it (§4.2). The front end renders it only
   where a claim actually needs qualifying.
   ------------------------------------------------------------------ */

const EVIDENCE = [
  'observed', // personally observed
  'built', // actually constructed
  'measured', // supported by collected data
  'literature', // supported by external research
  'interpreted', // author's interpretation
  'speculative', // hypothesis / future possibility
  'unknown', // currently unresolved
] as const;

const evidence = z.enum(EVIDENCE);

/* Lenses are tags, not departments. Open strings on purpose: in three
   years `sound` or `materiality` may matter more than `ritual`, and that
   must not require a refactor (§2.3). */
const lenses = z.array(z.string()).default([]);

/* An entry is written in the language it was thought in and is never
   translated — a 2022 garden note is partly valuable *because* it is in
   Chinese and dated. Listings mark the language; that is all. */
const lang = z.enum(['en', 'zh']).default('en');

const experiments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experiments' }),
  schema: z.object({
    number: z.number(),
    /* The piece's name. `title` stays the research question — a card shows the
       name first and the question underneath. */
    name: z.string(),
    nameZh: z.string().optional(),
    title: z.string(), // always a question
    date: z.date(),
    lenses,
    evidence,
    status: z.string().default('built'),
    /* Not optional. For a practice-led researcher the demo is the argument,
       not an illustration (§10). */
    video: z.string(),
    poster: z.string(),
    /* Optional tighter crop for card use. A piece shot in portrait is
       letterboxed in its 16:9 poster and reads as an empty black rectangle at
       card size; this lets the card show the work instead. */
    thumb: z.string().optional(),
    demo: z.string().optional(),
    demoNote: z.string().optional(),
    stack: z.array(z.string()).default([]),
    summary: z.string(),
    lang,

    /* Where this came from, as data rather than as a sentence buried in the
       prose. Renders as a lineage strip: field → reading → experiment, so
       that "how cultural research enters the work" is visible without
       reading 900 words first. */
    fromAtlas: z.array(z.string()).default([]),
    fromReadings: z.array(z.string()).default([]),
    followsFrom: z.array(z.string()).default([]),

    /* Version history. Thinking that changed, shown as a sequence rather
       than claimed in a paragraph. */
    process: z
      .array(z.object({ version: z.string(), note: z.string() }))
      .default([]),
  }),
});

const atlas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/atlas' }),
  schema: z.object({
    title: z.string(),
    place: z.string().optional(),
    date: z.date(), // the real original date, not the date it was written up
    revisited: z.date().optional(),
    dimensions: z.array(
      z.enum([
        'places',
        'practices',
        'spatial-principles',
        'materials',
        'cultural-references',
      ])
    ),
    evidence,
    summary: z.string(),
  }),
});

const observations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/observations' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    place: z.string().optional(),
    lenses,
    evidence,
  }),
});

const readings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/readings' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string(),
    work: z.string(),
    year: z.number().optional(),
    lenses,
    evidence,
  }),
});

const labNotes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab-notes' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    lenses,
    evidence,
    experiment: z.string().optional(), // slug of the related experiment
  }),
});

export const collections = {
  experiments,
  atlas,
  observations,
  readings,
  'lab-notes': labNotes,
};
