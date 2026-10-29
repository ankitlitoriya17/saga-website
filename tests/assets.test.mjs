import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { publicAssets, uiModules } from '../src/public-assets.mjs';

const root = new URL('../', import.meta.url);

test('local font resources exist and browser JavaScript stays within its byte budget', async () => {
  assert.equal(new Set(publicAssets.map(asset => asset.file)).size, publicAssets.length);
  const sizes = await Promise.all(publicAssets.map(async asset => ({ ...asset, bytes: (await stat(new URL(asset.file, root))).size })));
  const javascript = sizes.filter(asset => asset.type === 'javascript').reduce((sum, asset) => sum + asset.bytes, 0);
  const fonts = sizes.filter(asset => asset.type === 'font/ttf').reduce((sum, asset) => sum + asset.bytes, 0);
  assert.ok(javascript < 20 * 1024, `Browser scripts exceed 20 KiB: ${javascript}`);
  assert.ok(fonts < 128 * 1024, `Fonts exceed 128 KiB: ${fonts}`);
  const css = await readFile(new URL('styles/shared.css', root), 'utf8');
  for (const match of css.matchAll(/url\('([^']+)'\)/g)) {
    assert.ok(match[1].startsWith('../resource/fonts/'));
    await stat(new URL(match[1], new URL('styles/', root)));
  }
});

test('generated CSS and entry versions agree and every UI module receives the version', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const css = html.match(/styles\/shared\.css\?v=([a-f0-9]{12})/);
  const entry = html.match(/scripts\/site\.mjs\?v=([a-f0-9]{12})/);
  assert.ok(css && entry);
  assert.equal(css[1], entry[1]);
  const source = await readFile(new URL('scripts/site.mjs', root), 'utf8');
  assert.ok(source.includes('new URL(import.meta.url).search'));
  for (const module of uiModules) assert.ok(source.includes(`./ui/${module}.mjs` + '${version}'), module);
});

test('the versioned browser entry loads its native modules and tolerates pages without widgets', async () => {
  const year = { textContent: '' };
  globalThis.document = {
    querySelectorAll: selector => selector === '[data-year]' ? [year] : [],
    querySelector: () => null, getElementById: () => null,
  };
  globalThis.window = {};
  try {
    await import(new URL('scripts/site.mjs?v=module-smoke-check', root));
    assert.equal(year.textContent, String(new Date().getFullYear()));
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
});
