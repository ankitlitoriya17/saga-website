// Read-only HTTPS checks against the deployed website, compared with committed bytes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { site, pages } from '../src/site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root}`, '-C', root, ...args], { maxBuffer: 10 * 1024 * 1024 });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const commit = git('rev-parse', 'HEAD').toString().trim();
const checks = [
  ...pages.map(page => ({ path: page.file === 'index.html' ? '/' : `/${page.file}`, file: page.file, type: 'text/html' })),
  { path: '/styles/shared.css', file: 'styles/shared.css', type: 'text/css' },
  ...['site', 'deletion'].map(name => ({ path: `/scripts/${name}.js`, file: `scripts/${name}.js`, type: 'javascript' })),
  ...['brand', 'discover', 'details', 'dashboard', 'tenants', 'rent'].map(name => ({ path: `/resource/app/${name}.png`, file: `resource/app/${name}.png`, type: 'image/png' })),
  { path: '/property/?propertyId=spot-production-check', file: 'property/index.html', type: 'text/html' },
  { path: '/property/?propertyId=%E0%A4%98%E0%A4%B0%20A%2B%23%3F', file: 'property/index.html', type: 'text/html' },
  { path: '/property/?propertyId=bad%2Fid', file: 'property/index.html', type: 'text/html' },
  { path: '/property-share-assets/property-link.js', file: 'property-share-assets/property-link.js', type: 'javascript' },
  { path: '/property-share-assets/property.css', file: 'property-share-assets/property.css', type: 'text/css' },
  { path: '/.well-known/assetlinks.json', file: '.well-known/assetlinks.json', type: 'application/json' },
  { path: '/app-ads.txt', file: 'app-ads.txt', type: 'text/plain' },
];

const results = await Promise.all(checks.map(async check => {
  const response = await fetch(new URL(check.path, site.origin), {
    redirect: 'manual', headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, `${check.path}: expected HTTP 200 without redirects`);
  assert.ok(response.headers.get('content-type')?.includes(check.type), `${check.path}: wrong content type`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(sha256(body), sha256(git('show', `HEAD:${check.file}`)), `${check.path}: production differs from committed file`);
  if (check.file === '.well-known/assetlinks.json') {
    assert.ok(JSON.parse(body.toString()).some(entry => entry.target?.package_name === 'com.apnaghar.saga'));
  }
  if (check.path === '/') {
    console.log('Production response headers:', JSON.stringify(Object.fromEntries(
      ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy'].map(name => [name, response.headers.get(name)])
    )));
  }
  return { path: check.path, status: response.status, sha256: sha256(body).slice(0, 12) };
}));
console.table(results);
console.log(`Verified ${results.length} production URLs against commit ${commit}. Browser rendering and Android OS link dispatch require separate validation.`);
