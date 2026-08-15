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

/* Chinese alongside English, field by field. Bodies live in a `.zh.md` sibling;
   these are the short strings that every card, listing row and page header is
   built from, so that switching language switches the whole surface rather
   than just the chrome. All optional: an entry without them simply stays in
   the language it was written in. */

/* ------------------------------------------------------------------
   The study frame. An experiment that has grown into an actual study
   carries this block; the others simply omit it and render as before.
   The eleven steps are the same for every piece, so a second prototype
   can adopt the frame without any new code.

   Bilingual pairs are `{ en, zh }` objects here rather than the `Zh`
   suffix used elsewhere — the block is deeply nested and the pairs read
   better kept together.
   ------------------------------------------------------------------ */
const biText = z.object({ en: z.string(), zh: z.string() });

const study = z
  .object({
    subtitle: biText,
    keywords: biText,
    stage: biText,

    /* 01 — where the question came from, and the places it came from.
       Field sites are real, photographed, and dated; nothing is listed
       here that was not actually visited. */
    cultural: z.object({
      heading: biText,
      question: biText,
      sites: z
        .array(
          z.object({
            image: z.string(),
            place: biText,
            date: z.string(),
            caption: biText,
          })
        )
        .default([]),
      principles: z.array(biText).default([]),
      observations: z
        .array(
          z.object({
            n: z.string(),
            title: biText,
            observed: biText,
            translation: biText,
          })
        )
        .default([]),
      /* The four-level translation diagram. */
      ladder: z
        .array(z.object({ level: biText, items: biText }))
        .default([]),
    }),

    /* 02 */
    human: z.object({
      question: biText,
      body: biText,
      ask: biText,
      transform: z.array(z.object({ stage: biText, items: biText })).default([]),
    }),

    /* 03 — stated as influence, never as regulation. There is no evidence
       for a regulation claim and the page must not imply one. */
    rq: z.object({
      primary: biText,
      secondary: z.array(z.object({ id: z.string(), q: biText })).default([]),
    }),

    /* 04 */
    hypotheses: z.array(z.object({ id: z.string(), body: biText })).default([]),

    /* 05 */
    prototype: z.object({
      tagline: biText,
      metaphor: biText,
      calm: z.array(biText).default([]),
      unstable: z.array(biText).default([]),
    }),

    /* 06 */
    architecture: z.array(z.object({ stage: biText, items: biText })).default([]),

    /* 07 */
    experiment: z.object({
      goal: biText,
      measuresOf: z.array(biText).default([]),
      conditions: z
        .array(
          z.object({
            id: z.string(),
            name: biText,
            user: biText,
            purpose: biText,
          })
        )
        .default([]),
    }),

    /* 08 — "potential measures", never "results". */
    measurement: z
      .array(z.object({ group: biText, items: biText }))
      .default([]),

    /* 09 */
    status: z.object({
      built: z.array(biText).default([]),
      limitation: biText,
    }),

    /* 10 */
    reflection: z.object({ heading: biText, body: biText }),

    /* 11 */
    next: z.object({ heading: biText, items: z.array(biText).default([]) }),
  })
  .optional();

const experiments = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/*.zh.md'], base: './src/content/experiments' }),
  schema: z.object({
    number: z.number(),
    /* The piece's name. `title` stays the research question — a card shows the
       name first and the question underneath. */
    name: z.string(),
    nameZh: z.string().optional(),
    title: z.string(), // always a question
    titleZh: z.string().optional(),
    date: z.date(),
    lenses,
    evidence,
    status: z.string().default('built'),
    statusZh: z.string().optional(),
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
    demoNoteZh: z.string().optional(),
    stack: z.array(z.string()).default([]),
    summary: z.string(),
    summaryZh: z.string().optional(),
    lang,

    /* The research framing, as fields rather than prose. The prototype matrix
       on the home page and the head of each experiment page are built from
       exactly these, so the two can never drift apart. */
    mechanism: z.string().optional(),
    mechanismZh: z.string().optional(),
    coreQuestion: z.string().optional(),
    coreQuestionZh: z.string().optional(),
    humanQuestion: z.string().optional(),
    humanQuestionZh: z.string().optional(),
    researchQuestion: z.string().optional(),
    researchQuestionZh: z.string().optional(),
    hypothesis: z.string().optional(),
    hypothesisZh: z.string().optional(),
    builtPipeline: z.string().optional(),
    builtPipelineZh: z.string().optional(),
    researchTags: z.array(z.string()).default([]),
    researchTagsZh: z.array(z.string()).default([]),

    study,

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
  loader: glob({ pattern: ['**/*.md', '!**/*.zh.md'], base: './src/content/atlas' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string().optional(),
    place: z.string().optional(),
    placeZh: z.string().optional(),
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
    summaryZh: z.string().optional(),
  }),
});

const observations = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/*.zh.md'], base: './src/content/observations' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string().optional(),
    date: z.date(),
    place: z.string().optional(),
    placeZh: z.string().optional(),
    lenses,
    evidence,
  }),
});

const readings = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/*.zh.md'], base: './src/content/readings' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string().optional(),
    date: z.date(),
    author: z.string(),
    authorZh: z.string().optional(),
    work: z.string(),
    workZh: z.string().optional(),
    year: z.number().optional(),
    lenses,
    evidence,
  }),
});

const labNotes = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/*.zh.md'], base: './src/content/lab-notes' }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string().optional(),
    date: z.date(),
    lenses,
    evidence,
    experiment: z.string().optional(), // slug of the related experiment
  }),
});

/* Chinese bodies live beside their English original as `<slug>.zh.md`.
   Only the prose lives here — every structured field stays on the English
   file, so there is exactly one place where dates, evidence and lineage are
   declared and no way for the two languages to disagree about them.
   An entry with no `.zh.md` simply shows its original in both modes. */
const zhBody = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.zh.md', base: `./src/content/${dir}` }),
    schema: z.object({}).passthrough(),
  });

export const collections = {
  experiments,
  atlas,
  observations,
  readings,
  'lab-notes': labNotes,

  'experiments-zh': zhBody('experiments'),
  'atlas-zh': zhBody('atlas'),
  'observations-zh': zhBody('observations'),
  'readings-zh': zhBody('readings'),
  'lab-notes-zh': zhBody('lab-notes'),
};
