import test from 'node:test';
import assert from 'node:assert/strict';
import { initTabs } from '../scripts/ui/tabs.mjs';
import { initGallery } from '../scripts/ui/gallery.mjs';
import { initMotion } from '../scripts/ui/motion.mjs';
import { initNavigation } from '../scripts/ui/navigation.mjs';

// A bounded DOM double verifies event/state contracts. It does not claim to
// verify layout, browser focus trapping, image decoding, or OS/browser behaviour.
function element(id = '') {
  const attrs = new Map();
  const classes = new Set();
  const handlers = new Map();
  return {
    id, attrs, handlers, classes, hidden: false, dataset: {}, selectors: {}, lists: {},
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    setAttribute: (name, value) => attrs.set(name, value), getAttribute: name => attrs.get(name), removeAttribute: name => attrs.delete(name),
    querySelector(selector) { return this.selectors[selector] ?? null; },
    querySelectorAll(selector) { return this.lists[selector] ?? []; },
    addEventListener: (name, handler) => handlers.set(name, handler),
    focus() { this.focused = true; },
  };
}
const event = (extra = {}) => ({ prevented: false, preventDefault() { this.prevented = true; }, ...extra });

function tabFixture() {
  const document = element();
  const group = element();
  const list = element();
  const tabs = [element('tab-renter'), element('tab-owner')];
  const panels = [element('view-renter'), element('view-owner')];
  tabs.forEach((tab, i) => tab.setAttribute('href', `#${panels[i].id}`));
  list.lists['[data-tab]'] = tabs;
  group.selectors['[data-tablist]'] = list;
  document.lists['[data-tabs]'] = [group];
  document.getElementById = id => panels.find(panel => panel.id === id);
  return { document, group, list, tabs, panels };
}

test('tabs expose linked panels and one selected tab after enhancement', () => {
  const f = tabFixture();
  assert.ok(f.panels.every(panel => !panel.hidden));
  initTabs(f.document);
  assert.equal(f.list.getAttribute('role'), 'tablist');
  assert.equal(f.tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(f.tabs[1].getAttribute('aria-controls'), 'view-owner');
  assert.deepEqual(f.panels.map(panel => panel.hidden), [false, true]);
  assert.deepEqual(f.tabs.map(tab => tab.tabIndex), [0, -1]);
  const click = event();
  f.tabs[1].handlers.get('click')(click);
  assert.equal(click.prevented, true);
  assert.deepEqual(f.panels.map(panel => panel.hidden), [true, false]);
  assert.equal(f.panels[1].getAttribute('role'), 'tabpanel');
});

test('tabs support manual keyboard activation, wraparound, Home and End', () => {
  const f = tabFixture();
  initTabs(f.document);
  f.tabs[0].handlers.get('keydown')(event({ key: 'ArrowLeft' }));
  assert.equal(f.tabs[1].focused, true);
  assert.equal(f.panels[1].hidden, true); // focus alone must not activate a lazy screen
  f.tabs[1].handlers.get('keydown')(event({ key: ' ' }));
  assert.equal(f.panels[1].hidden, false);
  f.tabs[1].handlers.get('keydown')(event({ key: 'Home' }));
  assert.equal(f.tabs[0].focused, true);
  f.tabs[0].handlers.get('keydown')(event({ key: 'End' }));
  f.tabs[1].handlers.get('keydown')(event({ key: 'Enter' }));
  assert.equal(f.tabs[1].getAttribute('aria-selected'), 'true');
  const modified = event({ ctrlKey: true });
  f.tabs[0].handlers.get('click')(modified);
  assert.equal(modified.prevented, false);
  assert.equal(f.panels[1].hidden, false);
});

test('an incomplete tab group preserves its original accessible content', () => {
  const f = tabFixture();
  f.document.getElementById = () => null;
  initTabs(f.document);
  assert.ok(f.panels.every(panel => !panel.hidden));
  assert.equal(f.list.getAttribute('role'), undefined);
});

function galleryFixture(supported = true) {
  const document = element();
  document.documentElement = element();
  const dialog = element('screen-dialog');
  const title = element();
  const caption = element();
  const image = element();
  const counter = element();
  const controls = Object.fromEntries(['close', 'next', 'previous'].map(key => [key, element()]));
  const links = ['details', 'dashboard'].map(key => {
    const link = element();
    link.href = `https://spot.apnasheher.com/resource/app/screens/${key}.png`;
    link.dataset = { title: `${key} <example>`, caption: 'Fictional demo data' };
    link.selectors.img = { alt: `${key} app screen` };
    return link;
  });
  document.lists['[data-gallery]'] = links;
  document.getElementById = id => ({ 'screen-dialog': dialog, 'dialog-title': title, 'dialog-caption': caption })[id];
  dialog.selectors = { '[data-dialog-image]': image, '[data-original]': element(), '[data-counter]': counter, ...Object.fromEntries(Object.entries(controls).map(([key, value]) => [`[data-${key}]`, value])) };
  dialog.getBoundingClientRect = () => ({ left: 20, right: 100, top: 20, bottom: 100 });
  if (supported) {
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.handlers.get('close')(); };
  }
  return { document, dialog, image, title, caption, counter, controls, links };
}

test('gallery keeps original image links when native dialog is unavailable', () => {
  const f = galleryFixture(false);
  initGallery(f.document);
  assert.equal(f.links[0].handlers.size, 0);
  assert.ok(f.links[0].href.endsWith('/details.png'));
});

test('gallery opens, cycles, handles keyboard input and restores focus after close', () => {
  const f = galleryFixture();
  initGallery(f.document);
  f.links[0].handlers.get('click')(event());
  assert.equal(f.dialog.open, true);
  assert.equal(f.image.src, f.links[0].href);
  assert.equal(f.dialog.selectors['[data-original]'].href, f.links[0].href);
  assert.equal(f.image.alt, 'details app screen');
  assert.equal(f.title.textContent, 'details <example>'); // assigned as text, not HTML
  assert.match(f.counter.textContent, /1 of 2/);
  assert.ok(f.document.documentElement.classes.has('dialog-open'));
  f.controls.next.handlers.get('click')();
  assert.equal(f.image.src, f.links[1].href);
  f.controls.next.handlers.get('click')();
  assert.equal(f.image.src, f.links[0].href);
  f.dialog.handlers.get('keydown')(event({ key: 'ArrowLeft' }));
  assert.equal(f.image.src, f.links[1].href);
  f.controls.close.handlers.get('click')();
  assert.equal(f.dialog.open, false);
  assert.equal(f.links[0].focused, true);
  assert.equal(f.document.documentElement.classes.has('dialog-open'), false);
});

test('gallery preserves modified-click navigation and closes only outside dialog bounds', () => {
  const f = galleryFixture();
  initGallery(f.document);
  const modified = event({ metaKey: true });
  f.links[0].handlers.get('click')(modified);
  assert.equal(modified.prevented, false);
  f.links[0].handlers.get('click')(event());
  f.dialog.handlers.get('click')(event({ target: f.dialog, clientX: 50, clientY: 50 }));
  assert.equal(f.dialog.open, true);
  f.dialog.handlers.get('click')(event({ target: f.dialog, clientX: 5, clientY: 5 }));
  assert.equal(f.dialog.open, false);
});

test('reduced motion and unsupported observers keep content fully visible', () => {
  const document = element();
  const node = element();
  document.lists['[data-reveal]'] = [node];
  initMotion(document, {});
  initMotion(document, { IntersectionObserver() { throw new Error('should not construct'); }, matchMedia: () => ({ matches: true }) });
  assert.equal(node.classes.has('reveal-ready'), false);
  initMotion(document, { IntersectionObserver: class { constructor() { throw new Error('unsupported'); } } });
  assert.equal(node.classes.has('reveal-ready'), false);
});

test('changing reduced-motion preference reveals all pending content', () => {
  const document = element();
  const nodes = [element(), element()];
  document.lists['[data-reveal]'] = nodes;
  let observer;
  let preferenceChange;
  const window = {
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe() {} unobserve() {} disconnect() { this.disconnected = true; }
    },
    matchMedia: () => ({ matches: false, addEventListener: (_, callback) => { preferenceChange = callback; } }),
    addEventListener() {},
  };
  initMotion(document, window);
  assert.ok(nodes.every(node => node.classes.has('reveal-ready')));
  observer.callback([{ target: nodes[0], isIntersecting: true }]);
  assert.ok(nodes[0].classes.has('is-visible'));
  preferenceChange({ matches: true });
  assert.ok(nodes.every(node => !node.classes.has('reveal-ready')));
  assert.equal(observer.disconnected, true);
});

test('mobile navigation supports Escape and closes after a link selection', () => {
  const document = element();
  const menu = element();
  const summary = element();
  document.selectors['.mobile-navigation'] = menu;
  menu.selectors.summary = summary;
  menu.contains = () => false;
  initNavigation(document, {});
  menu.open = true;
  document.handlers.get('keydown')(event({ key: 'Escape' }));
  assert.equal(menu.open, false);
  assert.equal(summary.focused, true);
  menu.open = true;
  menu.handlers.get('click')({ target: { closest: () => ({}) } });
  assert.equal(menu.open, false);
});
