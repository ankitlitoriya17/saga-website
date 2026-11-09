import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const POSTS_PATH = resolve(ROOT, 'social/posts.json');
const STATE_PATH = resolve(ROOT, 'social/state.json');
const ORIGIN = 'https://spot.apnasheher.com';
const PLAY = 'https://play.google.com/store/apps/details?id=com.apnaghar.saga';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v27.0';
if (!/^v\d+\.\d+$/.test(GRAPH_VERSION)) throw new Error('Invalid META_GRAPH_VERSION');

export function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

export function selectPost(posts, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  if (posts.length !== 7 || !posts[weekday]?.slug) throw new Error('Invalid weekly campaign');
  return posts[weekday];
}

export function shouldPublish(state, date, channel) {
  // Pending/unknown results are never retried automatically: Meta can publish
  // successfully even if the API request times out.
  return !Object.hasOwn(state[date] || {}, channel);
}

export function captionFor(post, channel) {
  const suffix = channel === 'facebook'
    ? '\n\nDownload SPoT: ' + PLAY + '\nWebsite: ' + ORIGIN
    : '\n\nSearch SPoT on Google Play.\n' + ORIGIN;
  return post.caption + suffix + '\n\n' + post.hashtags;
}

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function commit(paths, message) {
  runGit(['add', ...paths]);
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: ROOT });
  if (result.status === 0) return;
  if (result.status !== 1) throw new Error('Cannot inspect git changes');
  runGit(['-c', 'user.name=github-actions[bot]', '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '-m', message]);
  // Fail closed on a concurrent push instead of forcibly overwriting the ledger.
  runGit(['push', 'origin', 'HEAD:main']);
}

function imageUrl(post) {
  return ORIGIN + '/social/images/' + encodeURIComponent(post.slug) + '.jpg';
}

async function imageIsPublic(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    return res.ok && (res.headers.get('content-type') || '').startsWith('image/jpeg');
  } catch {
    return false;
  }
}

async function waitForPublicImage(url) {
  // On the first run, GitHub Pages must deploy the new generated images.
  for (let attempt = 0; attempt < 15; attempt++) {
    if (await imageIsPublic(url)) return;
    if (attempt < 14) await new Promise(done => setTimeout(done, 20000));
  }
  throw new Error('Public JPEG unavailable. Check GitHub Pages deployment: ' + url);
}

function graphEndpoint(path) {
  return 'https://graph.facebook.com/' + GRAPH_VERSION + '/' + path;
}

async function graph(path, token, params = null) {
  const method = params === null ? 'GET' : 'POST';
  const url = new URL(graphEndpoint(path));
  if (params === null) url.searchParams.set('fields', 'id');
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params === null ? undefined : new URLSearchParams(params),
    signal: AbortSignal.timeout(30000),
  });
  let body;
  try { body = await res.json(); } catch { throw new Error('Meta returned non-JSON HTTP ' + res.status); }
  if (!res.ok || body.error) {
    const e = body.error || {};
    throw new Error('Meta API HTTP ' + res.status + ': code=' + (e.code || '?') +
      ' subcode=' + (e.error_subcode || '?') + ' ' + (e.message || 'Unknown error'));
  }
  return body;
}

async function containerStatus(containerId, token) {
  const url = new URL(graphEndpoint(containerId));
  url.searchParams.set('fields', 'status_code,status');
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error('Instagram container status check failed (HTTP ' + res.status + ')');
  return data.status_code;
}

function configuredChannels(env) {
  return [
    ...(env.FB_PAGE_ID && env.FB_PAGE_TOKEN ? ['facebook'] : []),
    ...(env.IG_USER_ID && (env.IG_PAGE_TOKEN || env.FB_PAGE_TOKEN) ? ['instagram'] : []),
  ];
}

export function isLive(env) {
  if (env.GITHUB_REF !== 'refs/heads/main' || env.SPOT_SOCIAL_LIVE !== 'true') return false;
  if (env.GITHUB_EVENT_NAME === 'schedule') return true;
  return env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.SPOT_MANUAL_LIVE === 'true';
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

async function run() {
  const now = new Date();
  const date = indiaDate(now);
  const posts = JSON.parse(await readFile(POSTS_PATH, 'utf8'));
  const post = selectPost(posts, date);
  const platforms = configuredChannels(process.env);
  const publicUrl = imageUrl(post);
  const live = isLive(process.env);
  await report('### SPoT Social — ' + date + '\nTopic: **' + post.slug +
    '**\nMode: **' + (live ? 'LIVE' : 'DRY RUN') + '**\nImage: ' + publicUrl);
  if (!live) {
    await report('Preview only. No social publishing, asset upload, or state changes.');
    await report('Facebook caption:\n\n' + captionFor(post, 'facebook'));
    await report('Instagram caption:\n\n' + captionFor(post, 'instagram'));
    return;
  }
  if (platforms.length === 0) throw new Error('No Meta accounts configured in GitHub Secrets');

  // This asset commit happens before any publish claim, and never overwrites existing media.
  commit(['social/images'], 'chore(social): prepare branded SPoT images');
  await waitForPublicImage(publicUrl);

  let state;
  try { state = JSON.parse(await readFile(STATE_PATH, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = {}; }
  const save = (channel, status, extra = {}) => {
    state[date] ||= {};
    state[date][channel] = { status, slug: post.slug, updated_at: new Date().toISOString(), ...extra };
    return writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n')
      .then(() => commit(['social/state.json'], 'chore(social): ' + date + ' ' + channel + ' ' + status));
  };

  let failures = 0;
  for (const platform of platforms) {
    if (!shouldPublish(state, date, platform)) {
      await report(platform + ': **SKIPPED** (record exists: ' + state[date][platform].status + ')');
      continue;
    }
    const token = platform === 'facebook'
      ? process.env.FB_PAGE_TOKEN
      : (process.env.IG_PAGE_TOKEN || process.env.FB_PAGE_TOKEN);
    const id = platform === 'facebook' ? process.env.FB_PAGE_ID : process.env.IG_USER_ID;
    try {
      // Validate credentials before claiming, so invalid tokens cannot use the posting slot.
      await graph(id, token);
      // Durable claim before external side effect. Unknown outcomes require manual review.
      await save(platform, 'pending');
      let resultId;
      if (platform === 'facebook') {
        const photo = await graph(id + '/photos', token, {
          url: publicUrl, caption: captionFor(post, 'facebook'), published: 'true',
        });
        resultId = photo.post_id || photo.id;
      } else {
        const media = await graph(id + '/media', token, {
          image_url: publicUrl, caption: captionFor(post, 'instagram'),
        });
        if (!media.id) throw new Error('Instagram did not return a creation ID');
        await save(platform, 'container_created', { container_id: media.id });
        let ready = false;
        for (let poll = 0; poll < 5; poll++) {
          const status = await containerStatus(media.id, token);
          if (status === 'FINISHED') { ready = true; break; }
          if (status === 'ERROR' || status === 'EXPIRED' || status === 'PUBLISHED') {
            throw new Error('Unexpected Instagram container status: ' + status);
          }
          if (poll < 4) await new Promise(done => setTimeout(done, 60000));
        }
        if (!ready) throw new Error('Instagram container processing timed out');
        const published = await graph(id + '/media_publish', token, { creation_id: media.id });
        resultId = published.id;
      }
      if (!resultId) throw new Error('Meta returned no published post ID');
      await save(platform, 'published', { post_id: resultId });
      await report(platform + ': **PUBLISHED** ID ' + resultId);
    } catch (error) {
      failures++;
      const message = safeError(error);
      // A commit failure after claiming must not be hidden by another attempted commit.
      try {
        if (state[date]?.[platform]) await save(platform, 'needs_review', { reason: message });
      } catch (ledgerError) {
        await report(platform + ': ledger error — ' + safeError(ledgerError));
      }
      await report(platform + ': **NEEDS REVIEW** — ' + message +
        '. Do not automatically retry without checking the platform first.');
    }
  }
  if (failures) process.exitCode = 1;
}

const invokedAsScript = process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedAsScript) run().catch(error => {
  console.error('SPoT social automation stopped:', safeError(error));
  process.exitCode = 1;
});
