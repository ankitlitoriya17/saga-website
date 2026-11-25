import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  indiaDate, resolveSlot, selectPost, shouldPublish, contentAlreadyUsed,
  isLive, captionFor, backupWindowAllowed,
} from '../scripts/social-content.mjs';

const posts = JSON.parse(readFileSync(new URL('../social/posts.json', import.meta.url), 'utf8'));
const angles = JSON.parse(readFileSync(new URL('../social/angles.json', import.meta.url), 'utf8'));
const launch = Date.UTC(2026, 10, 9);
const dateAt = days => new Date(launch + days * 86400000).toISOString().slice(0, 10);

test('India calendar day is calculated at local midnight', () => {
  assert.equal(indiaDate(new Date('2026-11-08T19:00:00Z')), '2026-11-09');
  assert.equal(indiaDate(new Date('2026-11-08T17:59:59Z')), '2026-11-08');
});
test('dispatch input selects the slot and rejects unknown values', () => {
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
test('hooks change on every post and themes rotate headline/opening variants', () => {
  for (const p of posts) {
    assert.ok(p.variants.length >= 4, p.slug + ' needs at least 4 variants');
    assert.equal(new Set(p.variants.map(v => v.caption)).size, p.variants.length);
    for (const v of p.variants) {
      assert.equal(v.headline.length, 2);
      assert.ok(v.headline.every(line => line.length > 0 && line.length <= 22), v.headline.join(' '));
      assert.ok(v.caption.length <= 400);
    }
  }
  let previous = null;
  const seenBySlug = {};
  for (let day = 0; day < 60; day++) {
    for (const slot of ['morning', 'evening']) {
      const post = selectPost(posts, angles, dateAt(day), slot);
      const hook = angles.hooks.find(h => post.lead.includes('\n\n' + h + ' '));
      assert.ok(hook, 'Hook missing at ' + post.filename);
      if (previous) assert.notEqual(hook, previous, 'Same hook twice in a row at ' + post.filename);
      previous = hook;
      const last = seenBySlug[post.slug];
      if (last) assert.notDeepEqual(post.headline, last, 'Theme headline repeated back to back: ' + post.slug);
      seenBySlug[post.slug] = post.headline;
    }
  }
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
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'schedule' }), false);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'true' }), true);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'false' }), false);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'pull_request' }), false);
  assert.equal(isLive({ ...base, GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'true', GITHUB_REF: 'refs/heads/test' }), false);
  assert.equal(isLive({ ...base, SPOT_SOCIAL_LIVE: 'false', GITHUB_EVENT_NAME: 'workflow_dispatch', SPOT_MANUAL_LIVE: 'true' }), false);
});
test('external scheduler dispatch accepts only near-slot IST windows', () => {
  assert.equal(backupWindowAllowed(new Date('2026-11-14T01:30:00Z'), 'morning'), true); // 07:00 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T13:30:00Z'), 'evening'), true); // 19:00 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T01:50:00Z'), 'morning'), true); // 07:20 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T13:50:00Z'), 'evening'), true); // 19:20 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T01:20:00Z'), 'morning'), false); // 06:50 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T13:20:00Z'), 'evening'), false); // 18:50 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T07:00:00Z'), 'morning'), false); // 12:30 IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T18:30:00Z'), 'evening'), false); // midnight IST
  assert.equal(backupWindowAllowed(new Date('2026-11-14T01:50:00Z'), 'invalid'), false);
});
test('creative captions contain real install links and branded tags', () => {
  const post = selectPost(posts, angles, '2026-11-09', 'morning');
  assert.match(captionFor(post, 'facebook'), /play\.google\.com\/store\/apps/);
  assert.match(captionFor(post, 'instagram'), /#SPoTApp/);
  assert.doesNotMatch(captionFor(post, 'instagram'), /link in bio/i);
  assert.match(post.contentId, /^[a-f0-9]{64}$/);
  assert.throws(() => selectPost(posts, angles, '2026-02-30', 'morning'), /Invalid/);
});

// ---- Feature-ad campaigns ----
import { validateCampaigns, campaignPost, CAMPAIGN_SCREENS } from '../scripts/social-content.mjs';
import { existsSync } from 'node:fs';
import { channels } from '../scripts/social-post.mjs';
const campaigns = JSON.parse(readFileSync(new URL('../social/campaigns.json', import.meta.url), 'utf8'));

test('campaign bank is valid and every campaign post takes over exactly its slot', () => {
  assert.equal(validateCampaigns(campaigns), true);
  const entries = campaigns.campaigns.flatMap(campaign => campaign.posts.map(entry => ({ campaign, entry })));
  assert.ok(entries.length >= 6);
  for (const { campaign, entry } of entries) {
    const post = selectPost(posts, angles, entry.date, entry.slot, campaigns);
    assert.equal(post.lead, entry.caption);
    assert.equal(post.link, campaign.link);
    assert.equal(post.slug, 'campaign-' + campaign.id);
    assert.equal(post.screen, entry.screen ?? campaign.screen);
    assert.ok(captionFor(post, 'facebook').includes(campaign.link));
    assert.match(captionFor(post, 'facebook'), /play\.google\.com\/store\/apps/);
    assert.ok(captionFor(post, 'instagram').includes(campaign.link));
    // Non-campaign slots stay on the normal rotation.
    const other = entry.slot === 'morning' ? 'evening' : 'morning';
    if (!campaignPost(campaigns, entry.date, other)) {
      assert.equal(selectPost(posts, angles, entry.date, other, campaigns).link, undefined);
    }
  }
});
test('campaign content never collides with the rotation or with itself', () => {
  const rotation = new Set();
  for (let day = 0; day < 784; day++) for (const slot of ['morning', 'evening']) {
    rotation.add(selectPost(posts, angles, dateAt(day), slot).contentId);
  }
  const ids = campaigns.campaigns.flatMap(campaign => campaign.posts)
    .map(entry => selectPost(posts, angles, entry.date, entry.slot, campaigns).contentId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => !rotation.has(id)));
});
test('inactive or invalid campaigns are ignored or rejected', () => {
  const entry = campaigns.campaigns[0].posts[0];
  const paused = { campaigns: campaigns.campaigns.map(campaign => ({ ...campaign, active: false })) };
  assert.equal(selectPost(posts, angles, entry.date, entry.slot, paused).link, undefined);
  const bad = structuredClone(campaigns);
  bad.campaigns[0].link = 'https://evil.example/';
  assert.throws(() => validateCampaigns(bad), /link/);
  const twice = structuredClone(campaigns);
  twice.campaigns[0].posts.push({ ...twice.campaigns[0].posts[0] });
  assert.throws(() => validateCampaigns(twice), /Two campaign posts/);
  const across = structuredClone(campaigns);
  across.campaigns.push({ ...across.campaigns[0], id: 'copy-of-first' });
  assert.throws(() => validateCampaigns(across), /Two campaign posts/);
  const screen = structuredClone(campaigns);
  screen.campaigns[0].posts[0].screen = '../secret';
  assert.throws(() => validateCampaigns(screen), /screen/);
});
test('campaign screens exist as real app screenshots', () => {
  for (const name of CAMPAIGN_SCREENS) {
    assert.ok(existsSync(new URL('../resource/app/screens/' + name + '.png', import.meta.url)), name);
  }
});
test('campaign posts publish only to the configured Meta channels', () => {
  const env = { FB_PAGE_ID: '1', FB_PAGE_TOKEN: 't', YT_CLIENT_ID: 'c', YT_CLIENT_SECRET: 's', YT_REFRESH_TOKEN: 'r' };
  assert.deepEqual(channels(env), ['facebook']);
  assert.deepEqual(channels({ ...env, IG_USER_ID: '2' }), ['facebook', 'instagram']);
  assert.equal(shouldPublish({}, '2026-11-24', 'evening', 'youtube'), false);
});
