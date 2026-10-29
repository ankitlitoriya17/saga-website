// Local preview only. GitHub Pages remains the production host.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { contentSecurityPolicy, pages } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const pagePaths = new Set(pages.map(page => `/${page.file}`));
const sharingPaths = new Set(['/property/index.html', '/property-share-assets/property.css', '/property-share-assets/property-link.js', '/.well-known/assetlinks.json']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8' };

export function previewServer() {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', `${contentSecurityPolicy}; frame-ancestors 'none'`);
    response.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const path = pathname === '/' ? '/index.html' : pathname === '/property/' ? '/property/index.html' : pathname;
      const allowed = pagePaths.has(path) || sharingPaths.has(path) || path === '/app-ads.txt' || path === '/styles/shared.css' ||
        ['/scripts/site.js', '/scripts/deletion.js'].includes(path) || /^\/resource\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|svg|pdf)$/.test(path);
      if (!allowed || path.includes('..') || path.includes('\\')) {
        response.writeHead(404).end('Not found'); return;
      }
      const body = await readFile(new URL(`.${path}`, root));
      response.writeHead(200, { 'Content-Type': mime[extname(path)], 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  previewServer().listen(4173, '127.0.0.1', () => console.log('SPoT preview: http://127.0.0.1:4173'));
}
