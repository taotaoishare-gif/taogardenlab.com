# TAO Garden

**An evolving research practice.**
A long-term research site built to Build Specification v4.0.

---

## The one rule that is not a style choice

**This site displays no counts of any kind.**

No view counts, no likes, no reading time, no "popular", no related-posts,
no infinite scroll, no analytics, no third-party scripts.

The reason is logical consistency, not taste. This research proceeds from the
hypothesis that *visible metrics induce a performance frame, and make people
chase the number instead of entering the state.* A site advancing that
hypothesis while displaying its own view counter would be refuting itself.

If you are ever tempted to add an entry counter, a "most read" list, or an
analytics snippet, that is the rule you would be breaking.

Related consequences already built in:

- Nothing is ranked. `/index` and `/notes` are purely chronological.
- There is no "featured work" ordering on the home page.
- Auto-playing video is silent, loops, and always has a visible pause control.
- Nothing loads as you scroll; every page ends.

---

## Adding research

**Adding a new entry means writing one markdown file. It never means changing
code.**

```
src/content/
  experiments/     seven-section template, video required
  atlas/           Field Atlas, five-step template
  observations/    30–150 words, no claim, no hedge
  readings/        200–800 words, must contain a position
  lab-notes/       "I tested X. It failed because Y. I changed Z."
```

Drop a `.md` file into the right folder with valid frontmatter and it appears
in its section, in `/notes` where relevant, on `/index`, and in Recent on the
home page. Nothing else needs touching.

### `evidence` is required on every entry

```
observed      personally observed
built         actually constructed
measured      supported by collected data
literature    supported by external research
interpreted   author's interpretation
speculative   hypothesis / future possibility
unknown       currently unresolved
```

It is mandatory in frontmatter so that the author has to decide what kind of
statement she is making before she can publish it. It is deliberately **almost
never displayed** — only at the foot of an experiment or atlas entry. It is
not shown on the home page, the preface, or observations, because those make
no claims. Honesty is structural here, so it does not have to depend on
willpower each time.

### Hierarchy is not decoration

A garden is quiet and its structure is violent — it never stops telling you
what to look at first. **Quiet means strong structure at low noise, not the
absence of hierarchy.** The first version of this site was low-noise and flat,
which is a different thing and a worse one.

So: display type is ~4× body, and appears **once per screen**. Whitespace is
deliberately uneven — paragraphs sit at `--step`, sections at `--section`,
screens at `--screen`. Adjacent bands alternate `--paper` and `--paper-sunk`.

`--forest` is the only colour, and it is permitted in exactly five places:
the current research question, the current nav item, link underlines, section
numerals, and diagram strokes. On the dark screens it becomes `--forest-glow`,
because `#3A5A40` is 2.5:1 on near-black. **A colour has force only while it is
rare.** If you find yourself adding a sixth use, remove one of the five first.

One consequence worth stating: a long question cannot be set at display size.
The threshold question is short *so that* it can be large; the formal working
question on `/research` is long, and is therefore set two steps down.

### Bilingual, without a second site

Interface strings live in `src/lib/ui.ts`. Fixed pages carry both languages in
one DOM, switched by `html[data-lang]` and `.en-only` / `.zh-only`. There is no
`/zh` route tree, because a duplicated route tree doubles the cost of every
edit and the Chinese half gets abandoned within a season.

**Research entries are never translated.** Each carries `lang: en | zh` and is
listed with a marker. Write in the language you thought in.

### Lenses are tags, not departments

`gardens · ritual · contemplative-traditions · embodied-interaction ·
computational-media`

They live in frontmatter and never in navigation. They are free strings: when
`sound` or `materiality` matters more than `ritual`, add it to a file. No
schema change, no refactor.

### The current question is expected to change

`src/lib/site.ts` holds `currentQuestion` and `currentInquiry`. The research
question changing is a result, not a failure — so it is one line of data, in
one place, and the site says "Current question", never "Our mission".

---

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
```

Deploy to Cloudflare Pages: build command `npm run build`, output directory
`dist`, no environment variables.

---

## Technical notes

- **Astro, static output.** No React, no Vue, no Tailwind, no CMS, no
  database, no user accounts.
- **Nothing is fetched from a third party at runtime.** Fonts (Newsreader,
  Inter, IBM Plex Mono) are self-hosted in `public/fonts`. MediaPipe — the
  hand-tracking and segmentation wasm and models used by the demos — is
  self-hosted in `public/vendor/mediapipe`. There are zero external requests
  from any page; verify with `node scripts/audit.mjs` (see below).
- **The demos** in `public/demos/` are the original single-file prototypes,
  copied verbatim except that CDN URLs were rewritten to the local vendor
  paths. Each keeps its own entry veil, its camera-permission gate, and its
  no-camera demo mode.
- **Video** is silent, 1280px wide H.264, ~30 s loops, with poster frames, cut
  from the real screen recordings in `04-technical prototype/`. Posters mean a
  page never goes blank if autoplay is refused.
- **CSS deviation from spec §15.2:** `--ink-faint` is `#6F6B61` rather than
  `#8E8A80`. The specified value gives 3.3:1 on paper and 3.0:1 on
  paper-sunk, which fails WCAG AA for the 11–13px mono it is used on; §17
  requires contrast to pass. Everything else in the palette is as specified.
- **`overflow-x: clip`, never `hidden`,** on `html`. `hidden` forces
  `overflow-y` to `auto`, which turns the element into its own scroll
  container and decouples it from the window.
- **Motion** is 400–700 ms on `cubic-bezier(0.4, 0, 0.2, 1)`: opacity and a few
  pixels, once. No parallax, no scroll-hijacking, no typewriter effects, no
  counting animations. `prefers-reduced-motion` disables all of it, including
  page transitions, and stops video autoplay.
- **Page transitions** use the CSS-only `@view-transition` rule. No router
  script.

---

## Checking it

```bash
node scripts/audit.mjs dist
```

Builds nothing; reads `dist/` and reports broken internal links, missing
`alt`, missing titles or descriptions, and — most importantly — any
reference to an external host. That last number must stay at zero.

---

## Content status

Some entries are drafts written from Tao's existing documents rather than from
her original field notes, and are marked with an HTML comment at the top of
the file. See `DRAFTS.md` for the list and what each one needs.
