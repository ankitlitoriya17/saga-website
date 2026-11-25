import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pages, pagePath, site } from '../src/site.mjs';

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('buy and sell page is a crawlable directory page linked from home and navigation', async () => {
  const page = pages.find(item => item.file === 'buy-sell/index.html');
  assert.equal(pagePath(page), '/buy-sell/');
  assert.match(await read('sitemap.xml'), /\/buy-sell\/</);
  const home = await read('index.html');
  assert.match(home, /href="buy-sell\/"/);
  assert.match(home, /id="buy-sell"/);
});

test('buy and sell page works without JavaScript and keeps honest claims', async () => {
  const html = await read('buy-sell/index.html');
  const main = html.match(/<main[^>]*>([\s\S]+?)<\/main>/)[1];
  assert.doesNotMatch(main, /<script|<form|<input|<iframe|data-tabs/);
  for (const id of ['buy', 'visit', 'sell', 'safety', 'sale-faq']) {
    assert.ok(main.includes(`href="#${id}"`), id);
    assert.ok(main.includes(`id="${id}"`), id);
  }
  assert.match(main, /does not verify ownership or handle payments/);
  assert.match(main, /EMI is an estimate only/);
  assert.match(main, /Illustration · Fictional/);
  assert.doesNotMatch(main, /\/sale\/|verified seller|guaranteed/i);
  for (const cta of main.matchAll(/href="(https:\/\/play\.google\.com[^"]+)"/g)) assert.equal(cta[1], site.playUrl);
});

test('public copy no longer positions SPoT as rental-only', async () => {
  for (const page of pages) {
    const html = await read(page.file);
    assert.doesNotMatch(html, /Easy rental solution|Easy Rental Solution|Made for everyday rentals/, page.file);
  }
});
