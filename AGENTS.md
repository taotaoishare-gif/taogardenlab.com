# AGENTS.md — TAO Garden Lab · Codex project rules

This repository is operated with **Codex → GitHub → Cloudflare Pages**.
It is a research-practice website for [taogardenlab.com](https://taogardenlab.com), not a marketing funnel.

## Delivery path

```
Codex edits locally
        ↓
npm run validate
        ↓
git commit + git push origin main
        ↓
Cloudflare Pages builds and publishes
        ↓
https://taogardenlab.com
```

- Production branch: `main`
- Production URL: `https://taogardenlab.com`
- Build command: `npm run build`
- Publish directory: `dist`
- Validation command: `npm run validate`
- One-command publish: `npm run publish -- "clear human summary"`

## Non-negotiable editorial rules

1. Never show metrics: no views, likes, reading time, popularity, follower counts, recommendations, analytics scripts, or infinite scroll. The work argues that visible metrics produce performance anxiety; the site must not contradict that claim.
2. Do not make clinical, therapeutic, or efficacy claims. State whether a proposition is observed, built, measured, interpreted, speculative, or unknown. A convincing visualisation is not evidence.
3. Do not invent field notes, participant feedback, sensor data, citations, or deployment outcomes. Keep uncertainty visible.
4. Preserve the self-hosted runtime rule. Fonts and libraries in `public/fonts/` and `public/vendor/` must not be swapped for CDNs.
5. Do not commit `dist/`, `node_modules/`, credentials, or source materials outside this repository. `.gitignore` is deliberate.

## Content architecture

Adding an entry should usually mean adding a Markdown file, not editing page logic. `src/content.config.ts` validates frontmatter and requires `evidence`.

```
src/content/
  experiments/   research works; video field required
  atlas/         cultural and field research
  observations/  short first-person records
  readings/      readings with a declared position
  lab-notes/     what was tried, where it failed, what changed
```

Write content in the language in which it was thought. Do not manufacture a translation simply to make a matching pair.

## Working with Codex

- Start with `git status --short` and preserve unrelated user edits.
- Use `rg` to locate code and content before changing it.
- Use `apply_patch` for source edits.
- Run `npm run validate` before every production push.
- Keep commits small, human-readable, and in Chinese or English; never use vague messages such as `update`.
- Do not push, change GitHub repository settings, or change Cloudflare Pages settings without Tao's explicit request in the current task.

## Where things live

| Need | Location |
| --- | --- |
| Site identity / current question | `src/lib/site.ts` |
| Global visual system | `src/styles/global.css` |
| Page structure | `src/pages/` |
| Shared components | `src/components/` |
| Static media and demos | `public/` |
| Content schemas | `src/content.config.ts` |
| Build / external-link audit | `scripts/audit.mjs` |
| Release script | `publish.sh` |
| Cloudflare runbook | `docs/CLOUDFLARE-PAGES.md` |

## Deployment ownership

GitHub Actions validates every push and pull request. Cloudflare Pages owns production deployment after a successful push to `main`. Do not add direct `wrangler pages deploy` commands unless the Git integration is intentionally replaced; two deployment authorities make rollback and debugging ambiguous.
