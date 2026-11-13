import { createHash } from 'node:crypto';

const LAUNCH = Date.parse('2026-11-09T00:00:00Z');
const DAY = 86_400_000;
const SLOTS = Object.freeze(['morning', 'evening']);
const VALID_CRON = { '30 1 * * *': 'morning', '30 13 * * *': 'evening' };

export function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

export function resolveSlot(env) {
  if (env.GITHUB_EVENT_NAME === 'schedule') {
    const slot = VALID_CRON[env.GITHUB_EVENT_SCHEDULE];
    if (!slot) throw new Error('Unknown schedule; refuse to select a posting slot');
    return slot;
  }
  const slot = env.SPOT_POST_SLOT || 'morning';
  if (!SLOTS.includes(slot)) throw new Error('Expected morning or evening slot');
  return slot;
}

// Backup requests must be near their intended local-time slot. Misconfigured
// third-party cron jobs cannot publish an unrelated or very late post.
export function backupWindowAllowed(now = new Date(), slot) {
  if (!SLOTS.includes(slot)) return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const number = type => Number(parts.find(part => part.type === type)?.value);
  const minutes = number('hour') * 60 + number('minute');
  const start = slot === 'morning' ? 7 * 60 + 15 : 19 * 60 + 15;
  const end = slot === 'morning' ? 10 * 60 : 22 * 60;
  return minutes >= start && minutes <= end;
}

export function selectPost(posts, angles, date, slot) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !SLOTS.includes(slot)) {
    throw new Error('Invalid date or posting slot');
  }
  const instant = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== date) {
    throw new Error('Invalid calendar date');
  }
  const days = Math.round((instant - LAUNCH) / DAY);
  if (days < 0) throw new Error('The campaign starts on 2026-11-09');
  if (posts.length !== 7 || new Set(posts.map(post => post.slug)).size !== 7) {
    throw new Error('Expected seven distinct content themes');
  }
  const index = days * 2 + SLOTS.indexOf(slot);
  const themeIndex = index % posts.length;
  const template = posts[themeIndex];
  const tips = angles.topics?.[template.slug];
  const tipCount = angles.topics?.[posts[0].slug]?.length;
  if (!Number.isInteger(tipCount) || tipCount < 1 ||
      !posts.every(post => angles.topics?.[post.slug]?.length === tipCount) ||
      !Array.isArray(angles.hooks) || angles.hooks.length < 1) {
    throw new Error('Content bank is incomplete');
  }
  const variation = Math.floor(index / posts.length);
  const tipIndex = variation % tipCount;
  const hookIndex = Math.floor(variation / tipCount);
  if (hookIndex >= angles.hooks.length) {
    throw new Error('Unique content exhausted: add new editorial topics before scheduling more posts');
  }
  const tip = tips[tipIndex];
  const hook = angles.hooks[hookIndex];
  if (!tip?.short || !tip?.text || !hook) throw new Error('Incomplete content bank entry');
  const lead = template.caption + '\n\n' + hook + ' ' + tip.text;
  // Content IDs do NOT include the date or a serial number. A reused caption
  // cannot pass uniqueness checks just because the day has changed.
  const contentId = createHash('sha256').update(lead + '\n' + template.hashtags)
    .digest('hex');
  return {
    date, slot, index, slug: template.slug, headline: template.headline,
    subline: tip.short, lead, hashtags: template.hashtags, contentId,
    filename: date + '-' + slot + '.jpg',
  };
}

export function shouldPublish(state, date, slot, channel) {
  if (!SLOTS.includes(slot) || !['facebook', 'instagram'].includes(channel)) return false;
  const day = state[date] || {};
  // Old one-post-per-day state represents the existing evening campaign.
  if (slot === 'evening' && Object.hasOwn(day, channel)) return false;
  return !Object.hasOwn(day[slot] || {}, channel);
}

export function contentAlreadyUsed(state, post) {
  for (const [day, record] of Object.entries(state)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !record || typeof record !== 'object') continue;
    for (const slot of SLOTS) {
      if (day === post.date && slot === post.slot) continue;
      for (const channel of ['facebook', 'instagram']) {
        if (record[slot]?.[channel]?.content_id === post.contentId) return true;
      }
    }
  }
  return false;
}

export function captionFor(post, channel) {
  const suffix = channel === 'facebook'
    ? '\n\nDownload SPoT: https://play.google.com/store/apps/details?id=com.apnaghar.saga\nWebsite: https://spot.apnasheher.com'
    : '\n\nSearch SPoT on Google Play.\nhttps://spot.apnasheher.com';
  return post.lead + suffix + '\n\n' + post.hashtags;
}

export function isLive(env) {
  if (env.GITHUB_REF !== 'refs/heads/main' || env.SPOT_SOCIAL_LIVE !== 'true') return false;
  if (env.GITHUB_EVENT_NAME === 'schedule') return true;
  return env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.SPOT_MANUAL_LIVE === 'true';
}
