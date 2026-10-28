const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { parseLink, validId, mount } = require('../property-share-assets/property-link.js');
const base = 'https://spot.apnasheher.com/property/?propertyId=';
const site = path.resolve(__dirname, '..');

test('query links preserve encoded IDs and decode once', () => {
  const id = 'घर A+#?%2F🏠';
  const parsed = parseLink(base + encodeURIComponent(id));
  assert.equal(parsed.id, id);
  assert.equal(parsed.canonical, base + encodeURIComponent(id));
  assert.equal(parsed.app, 'saga://property/' + encodeURIComponent(id));
  assert.equal(parseLink(base + 'a+b').id, 'a b');
  assert.equal(parseLink(base + 'a%2Bb').id, 'a+b');
  assert.equal(parseLink(base + '%EF%BF%BD').id, '�');
});

test('legacy paths and explicit static index preserve the same property', () => {
  assert.equal(parseLink('https://spot.apnasheher.com/property/legacy%2B123').id, 'legacy+123');
  assert.equal(parseLink('https://spot.apnasheher.com/property/index.html?propertyId=123').canonical, base + '123');
});

test('invalid, missing, duplicate, foreign and malformed identifiers are rejected', () => {
  for (const id of ['', ' ', '.', '..', 'a/b', 'a\\b', '__reserved__', 'a\n', 'x'.repeat(1501), '\ud800'])
    assert.equal(validId(id), false, id);
  for (const url of [base, base + '%2F', base + '%', base + '%FF', base + '%0a',
    base + 'a&propertyId=b', base + 'id&other=1', base + 'id#other',
    'https://spot.apnasheher.com/property/?other=1', 'https://evil.example/property/?propertyId=id',
    'https://user@spot.apnasheher.com/property/?propertyId=id']) assert.equal(parseLink(url), null, url);
});

function fakeDocument() {
  const elements = Object.fromEntries(['status','open-app','reference','property-reference','copy'].map(id =>
    [id, { hidden: true, addEventListener(name, handler) { this[name] = handler; },
      focus() { this.focused = true; }, select() { this.selected = true; } }]));
  return { getElementById: id => elements[id], elements };
}

test('landing opens the exact property and copies its static URL for after installation', async () => {
  const document = fakeDocument();
  let copied;
  mount(document, { href: base + 'known-id' }, { clipboard: { async writeText(text) { copied = text; } } });
  const el = document.elements;
  assert.equal(el['open-app'].href, 'saga://property/known-id');
  assert.equal(el['open-app'].hidden, false);
  assert.equal(el.reference.hidden, false);
  await el.copy.click();
  assert.equal(copied, base + 'known-id');
});

test('clipboard denial leaves a selectable reference', async () => {
  const document = fakeDocument();
  mount(document, { href: base + 'id' }, {});
  await document.elements.copy.click();
  assert.equal(document.elements['property-reference'].selected, true);
});

test('invalid references never expose an app-open action', () => {
  const document = fakeDocument();
  mount(document, { href: base + 'bad%2Fid' }, {});
  assert.equal(document.elements['open-app'].hidden, true);
  assert.match(document.elements.status.textContent, /invalid/);
});

test('unknown references reveal no listing data and need no backend', () => {
  const document = fakeDocument();
  mount(document, { href: base + 'deleted-or-unknown' }, {});
  assert.match(document.elements.status.textContent, /shared property/);
  const html = fs.readFileSync(path.join(site, 'property/index.html'), 'utf8');
  assert.match(html, /does not confirm that a property is currently published/);
  assert.match(html, /https:\/\/play.google.com\/store\/apps\/details\?id=com.apnaghar.saga/);
  const script = fs.readFileSync(path.join(site, 'property-share-assets/property-link.js'), 'utf8');
  assert.doesNotMatch(script, /\bfetch\(|XMLHttpRequest|firebaseio|firestore|localStorage|document\.cookie/);
});

test('a plain static HTTP server returns 200 for property URLs and assets without rewrites', async () => {
  // Directory-index serving only: no property router or rewrite is installed in this server.
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : '');
    const filename = path.resolve(site, '.' + relative);
    if (!filename.startsWith(site + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(filename, (error, body) => {
      if (error) { response.writeHead(404).end(); return; }
      response.writeHead(200).end(body);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const local = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const reference of ['known-id', 'deleted-id', 'घर A+#', 'invalid/id']) {
      const response = await fetch(local + '/property/?propertyId=' + encodeURIComponent(reference));
      assert.equal(response.status, 200);
      assert.match(await response.text(), /Get SPoT on Google Play/);
    }
    for (const asset of ['/property-share-assets/property-link.js', '/property-share-assets/property.css'])
      assert.equal((await fetch(local + asset)).status, 200);
    assert.equal((await fetch(local + '/unrelated-missing-file')).status, 404);
    const association = await fetch(local + '/.well-known/assetlinks.json');
    assert.equal(association.status, 200);
    assert.equal((await association.json())[0].target.package_name, 'com.apnaghar.saga');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
