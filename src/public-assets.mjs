import { screens } from './showcase.mjs';

export const uiModules = ['tabs', 'gallery', 'navigation', 'motion'];
// Used by local serving, release checks and cache version generation.
export const publicAssets = [
  { file: 'styles/shared.css', type: 'text/css' },
  { file: 'scripts/site.mjs', type: 'javascript' },
  ...uiModules.map(name => ({ file: `scripts/ui/${name}.mjs`, type: 'javascript' })),
  { file: 'scripts/deletion.js', type: 'javascript' },
  { file: 'resource/fonts/outfit-regular.ttf', type: 'font/ttf' },
  { file: 'resource/fonts/outfit-semibold.ttf', type: 'font/ttf' },
  { file: 'resource/fonts/OFL.txt', type: 'text/plain' },
  { file: 'resource/app/brand.png', type: 'image/png' },
  { file: 'resource/app/living-room.jpg', type: 'image/jpeg' },
  ...screens.map(screen => ({ file: `resource/app/screens/${screen.key}.png`, type: 'image/png' })),
];
