import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { site, pages, contentSecurityPolicy } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const check = process.argv.includes('--check');

for (const page of pages) {
  const content = (await readFile(new URL(`src/pages/${page.file}`, root), 'utf8')).replaceAll('\r\n', '\n')
    .replaceAll('{{PLAY_URL}}', escape(site.playUrl))
    .replaceAll('{{SUPPORT_EMAIL}}', escape(site.supportEmail));
  const canonical = `${site.origin}/${page.file === 'index.html' ? '' : page.file}`;
  const link = (file, label) => `<a href="${file}"${page.file === file ? ' aria-current="page"' : ''}>${label}</a>`;
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
  <link rel="icon" type="image/png" href="resource/app/brand.png">
  <link rel="apple-touch-icon" href="resource/app/brand.png">
  <link rel="stylesheet" href="styles/shared.css">
  <script src="scripts/site.js" defer></script>
${page.file === 'delete-account.html' ? '  <script src="scripts/deletion.js" defer></script>\n' : ''}\
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header">
    <a class="logo" href="index.html" aria-label="SPoT home"><img src="resource/app/brand.png" width="48" height="48" alt=""><span>SPoT<small>Easy rental solution</small></span></a>
    <nav class="primary-nav" aria-label="Main navigation">
      <a href="index.html#renters">For renters</a><a href="index.html#owners">For owners</a><a href="index.html#inside">The app</a>
    </nav>
    <a class="button button-small" href="${escape(site.playUrl)}" target="_blank" rel="noopener noreferrer">Get SPoT <span aria-hidden="true">↗</span><span class="sr-only">on Google Play (opens a new tab)</span></a>
  </header>
  <main id="main-content">
${content.trimEnd()}
  </main>
  <footer class="footer">
    <div class="footer-top"><a class="footer-wordmark" href="index.html">SPoT<span>A place for every next chapter.</span></a>
      <nav aria-label="Footer navigation">${link('career.html', 'Careers')}${link('privacy.html', 'Privacy policy')}${link('delete-account.html', 'Delete my account')}<a href="mailto:${site.supportEmail}">Contact support</a></nav>
    </div>
    <div class="footer-bottom"><p>© <span data-year>2026</span> SPoT by Apna Sheher</p><p>Made for everyday rentals. Made in India.</p></div>
  </footer>
</body>
</html>
`;
  const destination = new URL(page.file, root);
  if (check) {
    if (await readFile(destination, 'utf8') !== output) throw new Error(`${page.file} needs regeneration: npm run build`);
  } else await writeFile(destination, output);
}
console.log(check ? 'All generated pages are current.' : `Built ${pages.length} static pages in ${fileURLToPath(root)}`);
