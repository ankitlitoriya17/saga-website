import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { pages, pagePath, site } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

test('all pages have one distinct title, description, canonical and matching Open Graph URL', async () => {
  const titles = new Set();
  const canonicals = new Set();
  for (const page of pages) {
    const html = await read(page.file);
    const expected = `${site.origin}${pagePath(page)}`;
    assert.equal([...html.matchAll(/<title>/g)].length, 1, page.file);
    assert.equal([...html.matchAll(/<meta name="description"/g)].length, 1, page.file);
    assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, page.file);
    assert.ok(html.includes(`<link rel="canonical" href="${expected}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${expected}">`));
    assert.ok(page.description.length >= 60 && page.description.length <= 160);
    assert.ok(!titles.has(page.title));
    assert.ok(!canonicals.has(expected));
    titles.add(page.title); canonicals.add(expected);
  }
  const landlord = pages.find(page => page.file === 'landlords/index.html');
  assert.equal(pagePath(landlord), '/landlords/');
  assert.match(landlord.title, /Landlord.*Tenant.*Rent/);
});

test('landlord content and native FAQ remain complete without JavaScript', async () => {
  const html = await read('landlords/index.html');
  const main = html.match(/<main[^>]*>([\s\S]+?)<\/main>/)[1];
  assert.doesNotMatch(main, /<script|<form|<input|<iframe|\shidden(?:\s|=|>)|data-reveal|data-tabs/);
  assert.match(main, /lang="hi-Latn"/);
  for (const id of ['listing', 'tenants', 'rent', 'landlord-faq']) {
    assert.ok(main.includes(`href="#${id}"`));
    assert.ok(main.includes(`id="${id}"`));
  }
  const faq = main.slice(main.indexOf('id="landlord-faq"'));
  const entries = [...faq.matchAll(/<details><summary(?: lang="hi-Latn")?>([\s\S]+?)<\/summary><p(?: lang="hi-Latn")?>([\s\S]+?)<\/p><\/details>/g)];
  assert.equal(entries.length, 7);
  assert.ok(entries.every(entry => entry[1].length > 20 && entry[2].length > 50));
  assert.doesNotMatch(main, /tabindex="-1"|role="button"|<button/);
  assert.match(main, /does not transfer money/);
  assert.match(main, /does not automatically add a tenant or occupy a unit/);
  assert.match(main, /pending until landlord approval/);
  assert.match(main, /Fictional demo data/);
});

test('landlord Play CTAs use the real Android package without campaign or referral parameters', async () => {
  const html = await read('landlords/index.html');
  const ctas = [...html.matchAll(/<a\b[^>]*href="(https:\/\/play\.google\.com[^\"]+)"[^>]*>([\s\S]+?)<\/a>/g)];
  assert.equal(ctas.length, 3);
  for (const cta of ctas) {
    assert.equal(cta[1], site.playUrl);
    const url = new URL(cta[1]);
    assert.equal(url.searchParams.get('id'), 'com.apnaghar.saga');
    assert.deepEqual([...url.searchParams.keys()], ['id']);
    assert.match(cta[0], /rel="noopener noreferrer"/);
    assert.match(cta[2], /opens a new tab/);
  }
  assert.match(await read('index.html'), /href="landlords\/"/);
  for (const target of ['../index.html', '../privacy.html', '../delete-account.html']) {
    assert.ok(html.includes(`href="${target}"`), target);
  }
});

test('landlord directory index and its relative resources work on plain static hosting without rewrites', async t => {
  // This deliberately does not use the preview router: model a directory-index host.
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const file = new URL(`.${path.endsWith('/') ? `${path}index.html` : path}`, root);
      const body = await readFile(file);
      response.writeHead(200).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const url = new URL('/landlords/', origin);
  const response = await fetch(url);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const target = new URL(value.replaceAll('&amp;', '&'), url);
    if (target.origin !== origin || value.startsWith('#')) continue;
    const result = await fetch(target);
    assert.equal(result.status, 200, target.href);
    await result.arrayBuffer();
  }
});
