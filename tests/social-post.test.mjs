import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  indiaDate, resolveSlot, selectPost, shouldPublish, contentAlreadyUsed,
  isLive, captionFor,
} from '../scripts/social-content.mjs';

const posts = JSON.parse(readFileSync(new URL('../social/posts.json', import.meta.url), 'utf8'));
const angles = JSON.parse(readFileSync(new URL('../social/angles.json', import.meta.url), 'utf8'));
const launch = Date.UTC(2026, 10, 9);
const dateAt = days => new Date(launch + days * 86400000).toISOString().slice(0, 10);

test('India calendar day is calculated at local midnight', () => {
  assert.equal(indiaDate(new Date('2026-11-08T19:00:00Z')), '2026-11-09');
  assert.equal(indiaDate(new Date('2026-11-08T17:59:59Z')), '2026-11-08');
});
test('GitHub scheduled event maps to correct twice-daily India slot', () => {
  assert.equal(resolveSlot({
    GITHUB_EVENT_NAME: 'schedule', GITHUB_EVENT_SCHEDULE: '0 7 * * *',
  }), 'morning');
  assert.equal(resolveSlot({
    GITHUB_EVENT_NAME: 'schedule', GITHUB_EVENT_SCHEDULE: '0 19 * * *',
  }), 'evening');
  assert.throws(() => resolveSlot({
    GITHUB_EVENT_NAME: 'schedule', GITHUB_EVENT_SCHEDULE: '0 12 * * *',
  }));
  assert.equal(resolveSlot({
    GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_POST_SLOT: 'evening',
  }), 'evening');
  assert.throws(() => resolveSlot({
    GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_POST_SLOT: 'unknown',
  }));
});
test('morning and evening have distinct captions, creative paths and hashes', () => {
  const am = selectPost(posts, angles, '2026-11-09', 'morning');
  const pm = selectPost(posts, angles, '2026-11-09', 'evening');
  assert.equal(am.filename, '2026-11-09-morning.jpg');
  assert.equal(pm.filename, '2026-11-09-evening.jpg');
  assert.notEqual(am.contentId, pm.contentId);
  assert.notEqual(captionFor(am, 'facebook'), captionFor(pm, 'facebook'));
  assert.notEqual(am.subline, pm.subline);
  assert.equal(selectPost(posts, angles, '2026-11-09', 'morning').contentId, am.contentId);
});
test('content catalog has 98 distinct actionable tips and 16 hooks', () => {
  assert.equal(posts.length, 7);
  assert.equal(angles.hooks.length, 16);
  assert.equal(new Set(angles.hooks).size, angles.hooks.length);
  assert.equal(new Set(posts.map(post => post.slug)).size, 7);
  for (const p of posts) {
    assert.equal(angles.topics[p.slug].length, 14);
    assert.equal(new Set(angles.topics[p.slug].map(t => t.text)).size, 14);
    assert.ok(angles.topics[p.slug].every(t => t.short.length > 5));
  }
});
test('every post is unique across full 1,568-post capacity', () => {
  const hashes = new Set();
  const filenames = new Set();
  for (let day = 0; day < 784; day++) {
    for (const slot of ['morning', 'evening']) {
      const post = selectPost(posts, angles, dateAt(day), slot);
      assert.equal(hashes.has(post.contentId), false, 'Repeated text at ' + post.filename);
      assert.equal(filenames.has(post.filename), false);
      hashes.add(post.contentId);
      filenames.add(post.filename);
    }
  }
  assert.equal(hashes.size, 1568);
  assert.throws(() => selectPost(posts, angles, dateAt(784), 'morning'),
    /exhausted/i);
});
test('durable content IDs prohibit reuse on a later date or another slot', () => {
  const post = selectPost(posts, angles, dateAt(3), 'evening');
  const state = { [post.date]: { evening: {
    facebook: { status: 'published', content_id: post.contentId },
    instagram: { status: 'pending', content_id: post.contentId },
  } } };
  assert.equal(contentAlreadyUsed(state, post), false,
    'Both platforms can publish identical post in same slot');
  assert.equal(contentAlreadyUsed(state, { ...post, date: dateAt(4) }), true);
  assert.equal(contentAlreadyUsed(state, { ...post, slot: 'morning' }), true);
});
test('each channel and slot has its own no-retry claim', () => {
  const state = { '2026-11-09': { morning: {
    facebook: { status: 'pending' },
  }, evening: {
    instagram: { status: 'needs_review' },
  } } };
  assert.equal(shouldPublish(state, '2026-11-09', 'morning', 'facebook'), false);
  assert.equal(shouldPublish(state, '2026-11-09', 'morning', 'instagram'), true);
  assert.equal(shouldPublish(state, '2026-11-09', 'evening', 'facebook'), true);
  assert.equal(shouldPublish(state, '2026-11-09', 'evening', 'instagram'), false);
  assert.equal(shouldPublish(state, '2026-11-10', 'morning', 'facebook'), true);
});
test('legacy one-per-day evening claims still prevent duplicates', () => {
  const legacy = { '2026-11-09': {
    facebook: { status: 'published', slug: 'get-started' },
  } };
  assert.equal(shouldPublish(legacy, '2026-11-09', 'evening', 'facebook'), false);
  assert.equal(shouldPublish(legacy, '2026-11-09', 'morning', 'facebook'), true);
});
test('publishing requires explicit live variable and allowed branch and event', () => {
  const base = { SPOT_SOCIAL_LIVE: 'true', GITHUB_REF: 'refs/heads/main' };
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'schedule' }), true);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'true' }), true);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'false' }), false);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'pull_request' }), false);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: 'refs/heads/test' }), false);
  assert.equal(isLive({ ...base, SPOT_SOCIAL_LIVE: 'false', GITHUB_EVENT_NAME: 'schedule' }), false);
});
test('creative captions contain real install links and branded tags', () => {
  const post = selectPost(posts, angles, '2026-11-09', 'morning');
  assert.match(captionFor(post, 'facebook'), /play\.google\.com\/store\/apps/);
  assert.match(captionFor(post, 'instagram'), /#SPoTApp/);
  assert.doesNotMatch(captionFor(post, 'instagram'), /link in bio/i);
  assert.match(post.contentId, /^[a-f0-9]{64}$/);
  assert.throws(() => selectPost(posts, angles, '2026-02-30', 'morning'), /Invalid/);
});
