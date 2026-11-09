import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indiaDate, selectPost, shouldPublish, isLive, captionFor } from '../scripts/social-post.mjs';

const posts = JSON.parse(readFileSync(new URL('../social/posts.json', import.meta.url), 'utf8'));

test('India calendar day differs from UTC at local midnight', () => {
  assert.equal(indiaDate(new Date('2026-11-08T19:00:00Z')), '2026-11-09');
  assert.equal(indiaDate(new Date('2026-11-08T17:59:59Z')), '2026-11-08');
});

test('weekday schedule is correct', () => {
  assert.equal(selectPost(posts, '2026-11-08').slug, 'get-started');
  assert.equal(selectPost(posts, '2026-11-09').slug, 'list-property');
  assert.equal(selectPost(posts, '2026-11-13').slug, 'rent-receipts');
  assert.throws(() => selectPost([], '2026-11-09'));
});

test('a durable pending or uncertain state prevents duplicate publishing', () => {
  assert.equal(shouldPublish({}, '2026-11-09', 'facebook'), true);
  for (const status of ['pending', 'container_created', 'needs_review', 'published']) {
    const state = { '2026-11-09': { facebook: { status } } };
    assert.equal(shouldPublish(state, '2026-11-09', 'facebook'), false);
    assert.equal(shouldPublish(state, '2026-11-09', 'instagram'), true);
  }
});

test('live needs enablement and main branch plus approved event', () => {
  const env = { SPOT_SOCIAL_LIVE: 'true', GITHUB_REF: 'refs/heads/main' };
  assert.equal(isLive({ ...env, GITHUB_EVENT_NAME: 'schedule' }), true);
  assert.equal(isLive({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'true' }), true);
  assert.equal(isLive({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'false' }), false);
  assert.equal(isLive({ ...env, GITHUB_EVENT_NAME: 'pull_request' }), false);
  assert.equal(isLive({ ...env, GITHUB_EVENT_NAME: 'schedule', GITHUB_REF: 'refs/heads/test' }), false);
  assert.equal(isLive({ ...env, SPOT_SOCIAL_LIVE: 'false', GITHUB_EVENT_NAME: 'schedule' }), false);
});

test('each post contains useful captions and unique artwork slug', () => {
  assert.equal(posts.length, 7);
  assert.equal(new Set(posts.map(p => p.slug)).size, 7);
  for (const post of posts) {
    assert.match(post.slug, /^[a-z][a-z-]+$/);
    assert.equal(post.headline.length, 2);
    assert.ok(post.headline.every(line => line.length <= 24));
    assert.ok(post.caption.length >= 25);
    assert.match(captionFor(post, 'facebook'), /play\.google\.com/);
    assert.match(captionFor(post, 'instagram'), /#SPoTApp/);
    assert.doesNotMatch(captionFor(post, 'instagram'), /link in bio/i);
  }
});
