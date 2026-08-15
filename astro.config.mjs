// @ts-check
import { defineConfig } from 'astro/config';

/**
 * The demos are hand-written single-file prototypes living in `public/`, served
 * at `/demos/<name>/`. Static hosts resolve that to `index.html`; Vite's dev
 * middleware does not, so do it here to keep dev and production identical.
 */
function serveDemoIndexes() {
  return {
    name: 'tao-garden-demo-directory-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/demos\/[^/?#]+\/(\?|#|$)/.test(req.url)) {
          req.url = req.url.replace(/\/(\?|#|$)/, '/index.html$1');
        }
        next();
      });
    },
  };
}

// TAO Garden — static output, no integrations, no third-party anything.
export default defineConfig({
  site: 'https://taogardenlab.com',
  output: 'static',
  trailingSlash: 'ignore',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  devToolbar: { enabled: false },
  /* Astro reads --port or this field, not $PORT. Honour the environment so a
     harness that assigns a free port is obeyed, and fall back to the default
     when nothing is set. Nothing here depends on 4321 specifically. */
  server: {
    port: Number(process.env.PORT) || 4321,
  },
  vite: {
    plugins: [serveDemoIndexes()],
  },
});
