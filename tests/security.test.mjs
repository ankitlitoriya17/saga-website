import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { previewServer } from '../scripts/serve.mjs';
import { pages, site, contentSecurityPolicy } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

test('every page enforces local assets and blocks inline code and network connections', async () => {
  for (const { file } of pages) {
    const html = await read(file);
    assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('<script'));
    assert.ok(html.includes(contentSecurityPolicy));
    assert.match(html, /name="referrer" content="no-referrer"/);
    assert.doesNotMatch(html, /<style\b|\sstyle=|\son\w+\s*=|javascript:|<iframe\b|<object\b/i);
    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(script[1], /src="scripts\/[\w.-]+\.js"/);
      assert.equal(script[2].trim(), '');
    }
    for (const asset of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const value = asset[1].replaceAll('&amp;', '&');
      if (/^https:/.test(value)) {
        assert.ok([site.origin, 'https://play.google.com'].includes(new URL(value).origin), value);
      } else if (!value.startsWith('mailto:') && !value.startsWith('#')) {
        await access(new URL(value.split('#')[0], root));
      }
    }
    for (const anchor of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(anchor[0], /rel="noopener noreferrer"/);
    }
    assert.equal([...html.matchAll(/<main\b/g)].length, 1);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.doesNotMatch(html, /\{\{\w+\}\}/);
    for (const image of html.matchAll(/<img\b[^>]+>/g)) {
      assert.match(image[0], /alt="[^"]*"/);
      assert.match(image[0], /width="\d+" height="\d+"/);
    }
  }
});

test('runtime does not persist personal details, inject HTML, or call backend services', async () => {
  for (const file of ['scripts/site.js', 'scripts/deletion.js']) {
    assert.doesNotMatch(await read(file), /innerHTML|outerHTML|document\.write|\beval\b|localStorage|sessionStorage|document\.cookie|\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  }
});

async function deletionHarness({ valid = true, clipboardFails = false } = {}) {
  const handlers = new Map();
  const elements = Object.fromEntries(['deletion-form', 'deletion-fields', 'result', 'manual-template', 'email-template', 'copy-template'].map(id => [id, {
    hidden: true, value: '', textContent: '',
    addEventListener: (event, callback) => handlers.set(`${id}:${event}`, callback),
    focus() { this.focused = true; }, select() { this.selected = true; },
  }]));
  elements['deletion-form'].reportValidity = () => valid;
  elements['deletion-form'].elements = { email: { value: 'renter@example.com' }, notes: { value: '' } };
  const location = { href: '' };
  let clipboardText = '';
  vm.runInNewContext(await read('scripts/deletion.js'), {
    document: { getElementById: id => elements[id], querySelector: () => ({ getAttribute: () => `mailto:${site.supportEmail}` }) },
    window: { location },
    navigator: { clipboard: { writeText: async value => { if (clipboardFails) throw new Error('Permission denied'); clipboardText = value; } } },
  });
  return { elements, location, handlers, clipboard: () => clipboardText };
}

test('invalid email does not launch mail or copy a request', async () => {
  const h = await deletionHarness({ valid: false });
  await h.handlers.get('deletion-form:submit')({ preventDefault() {} });
  await h.handlers.get('copy-template:click')();
  assert.equal(h.location.href, '');
  assert.equal(h.clipboard(), '');
});

test('email controls are disabled without JavaScript and enabled only after handlers install', async () => {
  assert.match(await read('delete-account.html'), /<fieldset id="deletion-fields" disabled>/);
  const h = await deletionHarness();
  assert.equal(h.elements['deletion-fields'].disabled, false);
  assert.ok(h.handlers.has('deletion-form:submit'));
});

test('navigation fragments resolve and screenshot PNG dimensions match the layout', async () => {
  for (const { file } of pages) {
    const html = await read(file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
    for (const anchor of html.matchAll(/href="([^"#:]*)(?:#)([^"#]+)"/g)) {
      const target = await read(anchor[1] || file);
      assert.ok(target.includes(`id="${anchor[2]}"`), `${file}: ${anchor[0]}`);
    }
  }
  for (const file of ['discover', 'details', 'dashboard', 'tenants', 'rent']) {
    const png = await readFile(new URL(`resource/app/${file}.png`, root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1920);
  }
});

test('untrusted notes stay encoded in the mail body and cannot change recipients or headers', async () => {
  const h = await deletionHarness();
  const attack = '<img src=x onerror=alert(1)> &bcc=attacker@example.com\r\nSubject: changed # ?';
  h.elements['deletion-form'].elements.notes.value = attack;
  await h.handlers.get('deletion-form:submit')({ preventDefault() {} });
  const url = new URL(h.location.href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, site.supportEmail);
  assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
  assert.equal(url.searchParams.get('subject'), 'Account Deletion Request – SPoT');
  assert.ok(url.searchParams.get('body').includes(attack));
  assert.match(h.elements.result.textContent, /cannot confirm delivery/);
  assert.doesNotMatch(h.elements.result.textContent, /Request received|successfully sent|account deleted/i);
});

test('clipboard rejection leaves a selectable template; editing clears stale private data', async () => {
  const h = await deletionHarness({ clipboardFails: true });
  await h.handlers.get('copy-template:click')();
  assert.equal(h.elements['manual-template'].hidden, false);
  assert.match(h.elements['email-template'].value, /renter@example.com/);
  assert.equal(h.elements['email-template'].selected, true);
  h.handlers.get('deletion-form:input')();
  assert.equal(h.elements['manual-template'].hidden, true);
  assert.equal(h.elements['email-template'].value, '');
  assert.equal(h.elements.result.textContent, '');
});

test('clipboard success says the template must still be sent', async () => {
  const h = await deletionHarness();
  await h.handlers.get('copy-template:click')();
  assert.ok(h.clipboard().startsWith(`To: ${site.supportEmail}`));
  assert.match(h.elements.result.textContent, /send it/);
  assert.match(h.elements.result.textContent, /cannot confirm delivery/);
});

test('local preview serves actual pages and assets and rejects source, traversal and writes', async t => {
  const server = previewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', ...pages.map(page => `/${page.file}`), '/styles/shared.css', '/scripts/deletion.js', '/resource/app/discover.png', '/property/?propertyId=production-check', '/property-share-assets/property-link.js', '/property-share-assets/property.css', '/.well-known/assetlinks.json']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    await response.arrayBuffer();
  }
  for (const path of ['/src/site.mjs', '/.git/config', '/scripts/build.mjs', '/resource/%2e%2e%2fpackage.json', '/resource/%5c..%5cpackage.json', '/%ZZ']) {
    const response = await fetch(origin + path);
    assert.ok([400, 404].includes(response.status), path);
    await response.text();
  }
  const post = await fetch(origin, { method: 'POST', body: 'private-details' });
  assert.equal(post.status, 405);
});
