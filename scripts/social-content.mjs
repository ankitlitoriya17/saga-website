import { createHash } from 'node:crypto';

const LAUNCH = Date.parse('2026-11-09T00:00:00Z');
const DAY = 86_400_000;
const SLOTS = Object.freeze(['morning', 'evening']);
export const CHANNELS = Object.freeze(['facebook', 'instagram']);
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.apnaghar.saga';

export function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

export function resolveSlot(env) {
  const slot = env.SPOT_POST_SLOT || 'morning';
  if (!SLOTS.includes(slot)) throw new Error('Expected morning or evening slot');
  return slot;
}

// External-scheduler requests (source=backup) must be near their intended
// local-time slot. The window opens 5 minutes before the slot so a 07:00/19:00
// job works, and stays open for later retry jobs. Misconfigured third-party
// cron jobs cannot publish an unrelated or very late post.
export function backupWindowAllowed(now = new Date(), slot) {
  if (!SLOTS.includes(slot)) return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const number = type => Number(parts.find(part => part.type === type)?.value);
  const minutes = number('hour') * 60 + number('minute');
  const start = slot === 'morning' ? 6 * 60 + 55 : 18 * 60 + 55;
  const end = slot === 'morning' ? 10 * 60 : 22 * 60;
  return minutes >= start && minutes <= end;
}

/**
 * A dated feature-ad post from an active campaign takes over its slot. Campaign posts carry
 * their own caption, landing link and artwork. The rotation post
 * that would have run in that slot is simply skipped, never repeated later.
 */
export function campaignPost(campaigns, date, slot) {
  for (const campaign of campaigns?.campaigns || []) {
    if (campaign.active !== true) continue;
    const entry = (campaign.posts || []).find(post => post.date === date && post.slot === slot);
    if (entry) return { campaign, entry };
  }
  return null;
}

export function validateCampaigns(campaigns) {
  const seen = new Set();
  for (const campaign of campaigns?.campaigns || []) {
    if (!/^[a-z0-9-]{3,40}$/.test(campaign.id || '')) throw new Error('Invalid campaign id');
    if (!/^https:\/\/spot\.apnasheher\.com\/[a-z0-9/-]*$/.test(campaign.link || '')) {
      throw new Error('Campaign link must be a spot.apnasheher.com page');
    }
    if (typeof campaign.hashtags !== 'string' || !campaign.hashtags.includes('#SPoTApp')) {
      throw new Error('Campaign hashtags must include #SPoTApp');
    }
    for (const post of campaign.posts || []) {
      const key = post.date + '/' + post.slot;
      if (seen.has(key)) throw new Error('Two campaign posts claim ' + key);
      seen.add(key);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || !SLOTS.includes(post.slot)) throw new Error('Invalid campaign slot');
      if (!Array.isArray(post.headline) || post.headline.length !== 2 || post.headline.some(line => !line || line.length > 26)) {
        throw new Error('Campaign headline needs two short lines: ' + key);
      }
      if (!post.subline || post.subline.length > 40) throw new Error('Campaign subline too long: ' + key);
      if (!post.caption || post.caption.length > 600) throw new Error('Campaign caption missing or too long: ' + key);
    }
  }
  return true;
}

export function selectPost(posts, angles, date, slot, campaigns = null) {
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
  const special = campaignPost(campaigns, date, slot);
  if (special) {
    const { campaign, entry } = special;
    const lead = entry.caption;
    const contentId = createHash('sha256').update(lead + '\n' + campaign.hashtags).digest('hex');
    return {
      date, slot, index, slug: 'campaign-' + campaign.id, headline: entry.headline,
      subline: entry.subline, lead, hashtags: campaign.hashtags, contentId,
      filename: date + '-' + slot + '.jpg', campaign: campaign.id, link: campaign.link,
    };
  }
  const variation = Math.floor(index / posts.length);
  const tipIndex = variation % tipCount;
  const round = Math.floor(variation / tipCount);
  if (round >= angles.hooks.length) {
    throw new Error('Unique content exhausted: add new editorial topics before scheduling more posts');
  }
  // The hook changes on every post (the theme offset separates neighbouring posts). For a fixed
  // theme and tip, (themeIndex + tipIndex - round) mod hooks visits each hook exactly once
  // across the rounds, so every theme/tip/hook combination is still used exactly once.
  const hookCount = angles.hooks.length;
  const hookIndex = (((themeIndex + tipIndex - round) % hookCount) + hookCount) % hookCount;
  const tip = tips[tipIndex];
  const hook = angles.hooks[hookIndex];
  // The headline and opening paragraph rotate too, so a theme does not look identical
  // every time it comes round.
  const variants = template.variants;
  const variant = variants?.[variation % (variants?.length || 1)];
  if (!tip?.short || !tip?.text || !hook || !variant?.caption ||
      !Array.isArray(variant.headline) || variant.headline.length !== 2) {
    throw new Error('Incomplete content bank entry');
  }
  const lead = variant.caption + '\n\n' + hook + ' ' + tip.text;
  // Content IDs do NOT include the date or a serial number. A reused caption
  // cannot pass uniqueness checks just because the day has changed.
  const contentId = createHash('sha256').update(lead + '\n' + template.hashtags)
    .digest('hex');
  return {
    date, slot, index, slug: template.slug, headline: variant.headline,
    subline: tip.short, lead, hashtags: template.hashtags, contentId,
    filename: date + '-' + slot + '.jpg',
  };
}

export function shouldPublish(state, date, slot, channel) {
  if (!SLOTS.includes(slot) || !CHANNELS.includes(channel)) return false;
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
      for (const channel of CHANNELS) {
        if (record[slot]?.[channel]?.content_id === post.contentId) return true;
      }
    }
  }
  return false;
}

export function captionFor(post, channel) {
  if (post.link) {
    const suffix = channel === 'instagram'
      ? '\n\nUpdate SPoT from Google Play.\nDetails: ' + post.link
      : '\n\nDetails: ' + post.link + '\nDownload SPoT: ' + PLAY_URL;
    return post.lead + suffix + '\n\n' + post.hashtags;
  }
  const suffix = channel === 'facebook'
    ? '\n\nDownload SPoT: ' + PLAY_URL + '\nWebsite: https://spot.apnasheher.com'
    : '\n\nSearch SPoT on Google Play.\nhttps://spot.apnasheher.com';
  return post.lead + suffix + '\n\n' + post.hashtags;
}


export function isLive(env) {
  if (env.GITHUB_REF !== 'refs/heads/main' || env.SPOT_SOCIAL_LIVE !== 'true') return false;
  return env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.SPOT_MANUAL_LIVE === 'true';
}
