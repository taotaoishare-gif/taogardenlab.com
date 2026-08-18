# Cloudflare Pages runbook

The production flow is intentionally simple:

```
Codex → GitHub main → Cloudflare Pages → taogardenlab.com
```

Cloudflare Pages is the only deployer. GitHub Actions is only a quality gate. Do not deploy the same `dist/` directory separately through Wrangler unless this Git integration is deliberately retired.

## One-time Cloudflare check

Open **Cloudflare dashboard → Workers & Pages → tao-garden-site → Settings** and verify:

| Setting | Required value |
| --- | --- |
| Production branch | `main` |
| Framework preset | Astro (or None; both work) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | blank / repository root |
| Node version | read from `.nvmrc`, currently Node 22 |
| Environment variables | none required |

Then open **Custom domains** and confirm both the apex domain and `www` rule are intentional. The canonical URL in this repository is `https://taogardenlab.com`.

## Routine release

From the repository root:

```bash
npm run publish -- "Explain this release in one human sentence"
```

The command validates locally, creates a commit, pushes `main`, and prints the links for GitHub Actions and Cloudflare Pages. Cloudflare will create one deployment for the push.

## If a build fails on Cloudflare

1. Read the Cloudflare Pages deployment log; do not retry blindly.
2. Reproduce the failure locally with `npm ci && npm run validate`.
3. Commit the fix and push it as a new commit. Do not force-push production.
4. If production must return immediately, use **Cloudflare Pages → Deployments → previous successful deployment → Rollback**. Then fix forward in Git.

## If the domain is down but a Pages preview works

This is DNS/domain configuration, not an application deploy failure. Check Cloudflare **DNS**, **Custom domains**, and the registrar name servers before changing application code.

## What not to put in Cloudflare

- API keys, GitHub tokens, or other credentials are not needed for this static site and should not be added as Pages variables.
- No analytics script belongs in the site: it violates the site's editorial rule against visible metrics and third-party runtime requests.
