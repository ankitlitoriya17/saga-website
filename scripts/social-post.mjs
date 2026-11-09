import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { indiaDate, resolveSlot, selectPost, shouldPublish, contentAlreadyUsed,
  captionFor, isLive } from './social-content.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STATE_PATH = resolve(ROOT, 'social/state.json');
const PREVIEW_PATH = resolve(ROOT, 'social/.prepared.json');
const ORIGIN = 'https://spot.apnasheher.com';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v27.0';
if (!/^v\d+\.\d+$/.test(GRAPH_VERSION)) throw new Error('Invalid META_GRAPH_VERSION');

function runGit(args) {
  return execFileSync('git', args, {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
}
function commit(paths, message) {
  runGit(['add', ...paths]);
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: ROOT });
  if (result.status === 0) return;
  if (result.status !== 1) throw new Error('Cannot inspect staged changes');
  runGit(['-c', 'user.name=github-actions[bot]', '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '-m', message]);
  runGit(['push', 'origin', 'HEAD:main']); // no force pushes
}
async function report(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, message + '\n', 'utf8');
  }
}
function safeError(error) {
  let message = String(error?.message || error);
  for (const token of [process.env.FB_PAGE_TOKEN, process.env.IG_PAGE_TOKEN]) {
    if (token) message = message.replaceAll(token, '[REDACTED]');
  }
  return message.slice(0, 400);
}
async function loadState() {
  try {
    const state = JSON.parse(await readFile(STATE_PATH, 'utf8'));
    if (!state || Array.isArray(state) || typeof state !== 'object') {
      throw new Error('Invalid state.json format');
    }
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}
function publicImageUrl(post) {
  if (!/^\d{4}-\d{2}-\d{2}-(morning|evening)\.jpg$/.test(post.filename)) {
    throw new Error('Untrusted social image filename');
  }
  return ORIGIN + '/social/images/' + post.filename;
}
async function waitForPublicImage(url) {
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'HEAD', signal: AbortSignal.timeout(15000),
      });
      if (response.ok && (response.headers.get('content-type') || '').startsWith('image/jpeg')) return;
    } catch { /* GitHub Pages may be deploying */ }
    if (attempt < 14) await new Promise(done => setTimeout(done, 20000));
  }
  throw new Error('Creative not yet publicly available: ' + url);
}
async function graph(path, token, params = null) {
  const method = params === null ? 'GET' : 'POST';
  const url = new URL('https://graph.facebook.com/' + GRAPH_VERSION + '/' + path);
  if (params === null) url.searchParams.set('fields', 'id');
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params === null ? undefined : new URLSearchParams(params),
    signal: AbortSignal.timeout(30000),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Meta returned non-JSON HTTP ' + response.status); }
  if (!response.ok || result.error) {
    const e = result.error || {};
    throw new Error('Meta API HTTP ' + response.status + ': code=' + (e.code || '?') +
      ' subcode=' + (e.error_subcode || '?') + ' ' + (e.message || 'Unknown error'));
  }
  return result;
}
async function containerStatus(id, token) {
  const url = new URL('https://graph.facebook.com/' + GRAPH_VERSION + '/' + id);
  url.searchParams.set('fields', 'status_code,status');
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error('Instagram container status lookup failed HTTP ' + response.status);
  }
  return data.status_code;
}
function channels(env) {
  return [
    ...(env.FB_PAGE_ID && env.FB_PAGE_TOKEN ? ['facebook'] : []),
    ...(env.IG_USER_ID && (env.IG_PAGE_TOKEN || env.FB_PAGE_TOKEN) ? ['instagram'] : []),
  ];
}
async function buildPreview() {
  const posts = JSON.parse(await readFile(resolve(ROOT, 'social/posts.json'), 'utf8'));
  const angles = JSON.parse(await readFile(resolve(ROOT, 'social/angles.json'), 'utf8'));
  const date = indiaDate();
  const slot = resolveSlot(process.env);
  const post = selectPost(posts, angles, date, slot);
  await writeFile(PREVIEW_PATH, JSON.stringify(post, null, 2) + '\n', 'utf8');
  await report('### SPoT Social — ' + date + ' ' + slot + '\n' +
    'Content ID: ' + post.contentId.slice(0, 12) + '\n' +
    'Creative: ' + publicImageUrl(post));
  await report('Facebook caption:\n\n' + captionFor(post, 'facebook'));
  await report('Instagram caption:\n\n' + captionFor(post, 'instagram'));
}
async function run() {
  if (process.argv.includes('--prepare')) return buildPreview();
  const post = JSON.parse(await readFile(PREVIEW_PATH, 'utf8'));
  if (post.date !== indiaDate() || post.slot !== resolveSlot(process.env)) {
    throw new Error('Stale or mismatched prepared content: refusing to publish');
  }
  const posts = JSON.parse(await readFile(resolve(ROOT, 'social/posts.json'), 'utf8'));
  const angles = JSON.parse(await readFile(resolve(ROOT, 'social/angles.json'), 'utf8'));
  const expected = selectPost(posts, angles, post.date, post.slot);
  if (JSON.stringify(expected) !== JSON.stringify(post)) {
    throw new Error('Prepared content differs from current campaign');
  }
  const live = isLive(process.env);
  await report('### ' + post.date + ' ' + post.slot + ' — ' +
    (live ? 'LIVE' : 'DRY RUN'));
  if (!live) {
    await report('Preview only. No post published; no media or state uploaded.');
    return;
  }
  const platformList = channels(process.env);
  if (platformList.length === 0) throw new Error('No Meta publishing accounts configured');
  const state = await loadState();
  if (contentAlreadyUsed(state, post)) {
    throw new Error('Exact content has already been used in another slot');
  }
  for (const channel of platformList) {
    const record = state[post.date]?.[post.slot]?.[channel];
    if (record?.content_id && record.content_id !== post.contentId) {
      throw new Error('Existing slot claims a different post: manual reconciliation required');
    }
  }
  const dueChannels = platformList.filter(channel =>
    shouldPublish(state, post.date, post.slot, channel));
  if (dueChannels.length === 0) {
    await report('All configured channels already claimed this slot. No duplicate post.');
    return;
  }
  // The prepared image is the only creative staged and pushed.
  commit(['social/images/' + post.filename],
    'chore(social): artwork for ' + post.date + ' ' + post.slot);
  const imageUrl = publicImageUrl(post);
  await waitForPublicImage(imageUrl);
  const save = async (channel, status, extra = {}) => {
    state[post.date] ||= {};
    state[post.date][post.slot] ||= {};
    state[post.date][post.slot][channel] = {
      status, slug: post.slug, content_id: post.contentId,
      updated_at: new Date().toISOString(), ...extra,
    };
    await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
    commit(['social/state.json'],
      'chore(social): ' + post.date + ' ' + post.slot + ' ' + channel + ' ' + status);
  };
  let failures = 0;
  for (const channel of platformList) {
    if (!shouldPublish(state, post.date, post.slot, channel)) {
      await report(channel + ': SKIPPED (duplicate claim)');
      continue;
    }
    const token = channel === 'facebook'
      ? process.env.FB_PAGE_TOKEN
      : (process.env.IG_PAGE_TOKEN || process.env.FB_PAGE_TOKEN);
    const id = channel === 'facebook' ? process.env.FB_PAGE_ID : process.env.IG_USER_ID;
    try {
      await graph(id, token);
      // Durable claim BEFORE mutating Meta requests; unknown outcomes are not retried.
      await save(channel, 'pending');
      let publishedId;
      if (channel === 'facebook') {
        const response = await graph(id + '/photos', token, {
          url: imageUrl, caption: captionFor(post, 'facebook'), published: 'true',
        });
        publishedId = response.post_id || response.id;
      } else {
        const created = await graph(id + '/media', token, {
          image_url: imageUrl, caption: captionFor(post, 'instagram'),
        });
        if (!created.id) throw new Error('Instagram returned no media container ID');
        await save(channel, 'container_created', { container_id: created.id });
        let ready = false;
        for (let poll = 0; poll < 5; poll++) {
          const status = await containerStatus(created.id, token);
          if (status === 'FINISHED') { ready = true; break; }
          if (['ERROR', 'EXPIRED', 'PUBLISHED'].includes(status)) {
            throw new Error('Instagram media container state: ' + status);
          }
          if (poll < 4) await new Promise(done => setTimeout(done, 60000));
        }
        if (!ready) throw new Error('Instagram media processing timed out');
        const response = await graph(id + '/media_publish', token,
          { creation_id: created.id });
        publishedId = response.id;
      }
      if (!publishedId) throw new Error('Meta returned no published media ID');
      await save(channel, 'published', { post_id: publishedId });
      await report(channel + ': PUBLISHED ID ' + publishedId);
    } catch (error) {
      failures++;
      const message = safeError(error);
      try {
        if (state[post.date]?.[post.slot]?.[channel]) {
          await save(channel, 'needs_review', { reason: message });
        }
      } catch (ledgerError) {
        await report(channel + ': ledger error — ' + safeError(ledgerError));
      }
      await report(channel + ': NEEDS REVIEW: ' + message +
        ' (check account before manual retry)');
    }
  }
  if (failures) process.exitCode = 1;
}
const invokedAsScript = process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedAsScript) run().catch(error => {
  console.error('SPoT Social stopped: ' + safeError(error));
  process.exitCode = 1;
});
