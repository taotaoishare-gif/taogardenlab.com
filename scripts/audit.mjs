import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const DIST = process.argv[2];
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) files.push(p);
  }
})(DIST);

const problems = [];
const externals = new Set();
let imgCount = 0;
let noAlt = 0;

const routeExists = (url) => {
  const clean = url.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'));
  const p = clean.replace(/^\//, '');
  return (
    existsSync(join(DIST, p)) ||
    existsSync(join(DIST, p, 'index.html')) ||
    existsSync(join(DIST, p + '.html'))
  );
};

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '');

  /* The demos are Tao's original single-file prototypes, copied in verbatim.
     They are their own documents (lang="zh", their own heading structure) and
     are deliberately not held to the site's page conventions — but they are
     still checked for broken links and external hosts below. */
  const isDemo = page.startsWith('/demos/');

  if (!isDemo) {
    const h1s = html.match(/<h1[\s>]/g) || [];
    if (h1s.length !== 1) problems.push(`${page}: ${h1s.length} <h1> (expected 1)`);
    if (!/<html lang="[a-z-]+"/i.test(html)) problems.push(`${page}: missing lang`);
    if (!/<title>/.test(html)) problems.push(`${page}: missing <title>`);
    if (!/name="description"/.test(html)) problems.push(`${page}: missing description`);

    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      imgCount++;
      if (!/\salt=/.test(m[0])) { noAlt++; problems.push(`${page}: <img> without alt`); }
    }

    // The rule from README: this site shows no counts of any kind.
    const metric = html.match(/\b(views?|reads?|likes|shares|trending|popular|most read)\b\s*[:·]?\s*\d/i);
    if (metric) problems.push(`${page}: looks like a count metric -> "${metric[0]}"`);
  }

  // links + assets
  const urls = [
    ...[...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const url of urls) {
    if (/^(mailto:|tel:|data:|#)/.test(url)) continue;
    if (/^https?:\/\//.test(url)) {
      if (!url.startsWith('https://taogardenlab.com')) externals.add(`${page} -> ${url}`);
      continue;
    }
    if (!url.startsWith('/')) continue; // relative asset within same dir, skip
    if (!routeExists(url)) problems.push(`${page}: broken -> ${url}`);
  }
}

console.log(`pages: ${files.length}`);
console.log(`images: ${imgCount} (missing alt: ${noAlt})`);
console.log(`\nexternal references (${externals.size}):`);
for (const e of externals) console.log('  ' + e);
console.log(`\nproblems (${problems.length}):`);
for (const p of problems.slice(0, 40)) console.log('  ' + p);
