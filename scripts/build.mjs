import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { site, pages, pagePath, contentSecurityPolicy } from '../src/site.mjs';
import { renderIcons, icon } from '../src/icons.mjs';
import { experience, gallery, phone } from '../src/components.mjs';
import { publicAssets } from '../src/public-assets.mjs';

const root = new URL('../', import.meta.url);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const check = process.argv.includes('--check');
const digest = createHash('sha256');
for (const asset of publicAssets) digest.update(await readFile(new URL(asset.file, root)));
const version = digest.digest('hex').slice(0, 12);

for (const page of pages) {
  const prefix = '../'.repeat(page.file.split('/').length - 1);
  const content = renderIcons((await readFile(new URL(`src/pages/${page.file}`, root), 'utf8')).replaceAll('\r\n', '\n')
    .replaceAll('{{PLAY_URL}}', escape(site.playUrl))
    .replaceAll('{{SUPPORT_EMAIL}}', escape(site.supportEmail))
    .replaceAll('{{EXPERIENCE}}', experience())
    .replaceAll('{{GALLERY}}', gallery())
    .replaceAll('{{HERO_PHONE}}', phone('discover', { priority: true }))
    .replaceAll('{{LANDLORD_PHONE}}', phone('dashboard', { priority: true, assetPrefix: prefix }))
    .replaceAll('{{TENANTS_PHONE}}', phone('tenants', { assetPrefix: prefix }))
    .replaceAll('{{RENT_PHONE}}', phone('rent', { assetPrefix: prefix }))
    .replaceAll('{{ROOT}}', prefix));
  const canonical = `${site.origin}${pagePath(page)}`;
  const link = (file, label) => `<a href="${prefix}${file}"${pagePath(page).slice(1) === file || page.file === file ? ' aria-current="page"' : ''}>${label}</a>`;
  const navigation = site.navigation.map(item => item.href ? link(item.href, item.label) : `<a href="${prefix}index.html#${item.id}"${page.file === 'index.html' ? ' data-nav' : ''}>${item.label}</a>`).join('');
  const output = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escape(contentSecurityPolicy)}">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="${site.themeColor}">
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(page.title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/resource/app/brand.png">
  <link rel="icon" type="image/png" href="${prefix}resource/app/brand.png">
  <link rel="apple-touch-icon" href="${prefix}resource/app/brand.png">
  <link rel="preload" href="${prefix}resource/fonts/outfit-regular.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="${prefix}styles/shared.css?v=${version}">
${page.stylesheet ? `  <link rel="stylesheet" href="${prefix}${page.stylesheet}?v=${version}">\n` : ''}\
  <script type="module" src="${prefix}scripts/site.mjs?v=${version}"></script>
${page.file === 'delete-account.html' ? '  <script src="scripts/deletion.js" defer></script>\n' : ''}\
</head>
<body id="top">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header">
    <a class="logo" href="${prefix}index.html" aria-label="SPoT home"><img src="${prefix}resource/app/brand.png" width="48" height="48" alt=""><span>SPoT<small>Easy rental solution</small></span></a>
    <nav class="primary-nav" aria-label="Main navigation">${navigation}</nav>
    <div class="header-actions"><a class="button button-small" href="${escape(site.playUrl)}" target="_blank" rel="noopener noreferrer">Get the app ${icon('arrow')}<span class="sr-only">on Google Play (opens a new tab)</span></a>
      <details class="mobile-navigation"><summary aria-label="Navigation menu">${icon('menu')}</summary><nav aria-label="Mobile navigation">${navigation}<a href="mailto:${site.supportEmail}">Contact support ${icon('arrow')}</a></nav></details>
    </div>
  </header>
  <main id="main-content">
${content.trimEnd()}
  </main>
  <footer class="footer">
    <div class="footer-top"><a class="footer-wordmark" href="${prefix}index.html">SPoT<span>A place for every next chapter.</span></a>
      <nav aria-label="Footer navigation">${link('landlords/', 'For landlords')}${link('career.html', 'Careers')}${link('privacy.html', 'Privacy policy')}${link('delete-account.html', 'Delete my account')}<a href="mailto:${site.supportEmail}">Contact support</a></nav>
    </div>
    <div class="footer-bottom"><p>© <span data-year>2026</span> SPoT by Apna Sheher</p><p>Made for everyday rentals. Made in India.</p><a href="#top">Back to top ${icon('arrow')}</a></div>
  </footer>
</body>
</html>
`;
  const destination = new URL(page.file, root);
  if (check) {
    if (await readFile(destination, 'utf8') !== output) throw new Error(`${page.file} needs regeneration: npm run build`);
  } else {
    await mkdir(new URL('./', destination), { recursive: true });
    await writeFile(destination, output);
  }
}
console.log(check ? 'All generated pages are current.' : `Built ${pages.length} static pages in ${fileURLToPath(root)}`);
