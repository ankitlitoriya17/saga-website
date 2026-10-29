// Small, local SVGs. No icon CDN, runtime drawing, or duplicated path definitions.
const paths = {
  arrow: '<path d="M6 18 18 6M6 6h12v12"/>',
  right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  left: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  key: '<circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-3-3 3-3m-6 0 3-3"/>',
  building: '<path d="M4 21V6l8-3v18M12 9h8v12M2 21h20M7 8h2m-2 4h2m-2 4h2m6-4h2m-2 4h2"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5"/>',
  receipt: '<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2Zm4 6h6m-6 4h6m-6 4h3"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/><path d="M7 9h10M7 13h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  play: '<path d="m5 3 15 9-15 9Z"/>',
  expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
};

export function icon(name) {
  if (!paths[name]) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
export const renderIcons = html => html.replace(/\{\{icon:([a-z]+)\}\}/g, (_, name) => icon(name));
