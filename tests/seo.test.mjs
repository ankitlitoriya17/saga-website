import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { site, pages, pagePath } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

test('every page has canonical, Open Graph and Twitter card tags', async () => {
  for (const page of pages) {
    const html = await read(page.file);
    assert.ok(html.includes(`<link rel="canonical" href="${site.origin}${pagePath(page)}">`), page.file);
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'og:site_name']) {
      assert.ok(html.includes(`property="${tag}"`), `${page.file} ${tag}`);
    }
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), page.file);
    assert.ok(html.includes(`${site.origin}/${site.socialImage.file}`), page.file);
  }
});

test('social preview image is the declared 1200x630 PNG and stays small', async () => {
  const bytes = await readFile(new URL(site.socialImage.file, root));
  assert.equal(bytes.readUInt32BE(16), site.socialImage.width);
  assert.equal(bytes.readUInt32BE(20), site.socialImage.height);
  assert.ok((await stat(new URL(site.socialImage.file, root))).size < 300_000);
});

test('robots.txt and sitemap.xml list only indexable pages', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, new RegExp(`Sitemap: ${site.origin}/sitemap.xml`));
  const sitemap = await read('sitemap.xml');
  for (const page of pages) {
    assert.equal(sitemap.includes(`<loc>${site.origin}${pagePath(page)}</loc>`), !page.noindex, page.file);
    assert.equal((await read(page.file)).includes('content="noindex,follow"'), Boolean(page.noindex), page.file);
  }
});

test('homepage carries valid app and organization structured data', async () => {
  const html = await read('index.html');
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const graph = JSON.parse(json)['@graph'];
  const app = graph.find(item => item['@type'] === 'MobileApplication');
  assert.equal(app.operatingSystem, 'ANDROID');
  assert.equal(app.downloadUrl, site.playUrl);
  assert.ok(graph.some(item => item['@type'] === 'Organization'));
});
