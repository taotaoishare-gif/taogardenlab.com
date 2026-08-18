# Codex → GitHub → Cloudflare workflow

## Roles

| Layer | Responsibility | Does not do |
| --- | --- | --- |
| Codex | design, code, content changes, local validation | publish without Tao's instruction |
| GitHub | source of truth, commit history, CI validation | host credentials or build artefacts |
| Cloudflare Pages | build `main`, host previews and production | become a second source of code |

## A normal change

1. Open the repository in Codex.
2. Ask Codex to make a scoped change.
3. Review the local preview and run `npm run validate`.
4. When the change is accepted, ask Codex to publish it or run:

   ```bash
   npm run publish -- "Describe the change"
   ```

5. GitHub Actions turns green; Cloudflare Pages deploys the same commit.
6. Check `https://taogardenlab.com` after the Pages deployment completes.

## A safe collaboration pattern

- Use `main` for small, reviewed releases.
- For larger visual or structural work, create a branch and a pull request. Cloudflare Pages provides a preview URL for the PR; merge only after review.
- Keep a release to one coherent idea. This makes a rollback meaningful.

## GitHub authentication, once per Mac

The current GitHub CLI token has expired. In Terminal, from any directory:

```bash
gh auth login -h github.com -p https -w
```

Choose **Login with a web browser**, complete the GitHub approval page, then confirm with:

```bash
gh auth status
git -C "/Users/tao/Documents/🌿TAO Garden/tao-garden-site" push
```

This authorises GitHub only. Cloudflare Pages continues to deploy through its existing Git integration; no Cloudflare API token is needed for the routine workflow.

## Useful commands

```bash
# Where am I and what changed?
git status --short

# Local development
npm run dev

# Release-quality validation
npm run validate

# Publish after review
npm run publish -- "清楚说明这次改了什么"

# Check the GitHub connection
gh auth status
git remote -v
```
