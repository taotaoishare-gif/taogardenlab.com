import type { APIRoute } from 'astro';
import { allEntries } from '../lib/entries';

/* Hand-rolled rather than an integration — one fewer dependency, and the route
   list is short enough to see at a glance. */
export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://taogardenlab.com')).origin;

  const staticPaths = [
    '/',
    '/preface',
    '/research',
    '/experiments',
    '/atlas',
    '/notes',
    '/about',
    '/index',
  ];

  const entries = await allEntries();

  const urls = [
    ...staticPaths.map((path) => ({ loc: base + path, lastmod: null as string | null })),
    ...entries.map((entry) => ({
      loc: base + entry.href,
      lastmod: entry.date.toISOString().slice(0, 10),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
