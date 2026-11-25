import { screens, experiences } from './showcase.mjs';
import { icon } from './icons.mjs';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const screen = key => {
  const found = screens.find(item => item.key === key);
  if (!found) throw new Error(`Unknown screen: ${key}`);
  return found;
};

export function phone(key, { priority = false, assetPrefix = '' } = {}) {
  const item = screen(key);
  return `<div class="device-frame"><img src="${assetPrefix}resource/app/screens/${item.key}.png" width="1080" height="2160" ${priority ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="${escape(item.alt)}"></div>`;
}

// Illustration only: no site visit screenshot exists yet, so this fictional chat is clearly labelled.
export const saleArt = () => `<figure class="experience-screen sale-art"><div class="sale-card" aria-hidden="true">
        <span class="sale-tag">Inbox · Corner plot</span>
        <span class="sale-bubble">Is the plot still available? Can I see it this weekend?</span>
        <span class="sale-bubble is-reply">Yes. Book a visit and I’ll confirm a time.</span>
        <span class="small-label">BOOK A SITE VISIT</span>
        <span class="sale-slots"><span>Sat · 11 AM</span><span class="is-picked">Sun · 5 PM ${icon('check')}</span><span>Mon · 10 AM</span></span>
        <span class="sale-meta">Confirmed. Reminder 2 hours before.</span>
      </div><figcaption>Illustration · Fictional chat</figcaption></figure>`;

export function experience() {
  return `<div class="experience" data-tabs>
    <div class="persona-tabs" data-tablist aria-label="Explore the renter, owner or buy and sell experience">${experiences.map(item => `<a id="tab-${item.key}" href="#view-${item.key}" data-tab>${escape(item.label)} ${icon('arrow')}</a>`).join('')}</div>
    <div class="experience-panels">${experiences.map(item => `<section id="view-${item.key}" class="experience-panel" data-panel aria-labelledby="tab-${item.key}">
      <div class="experience-copy"><p class="eyebrow">${item.eyebrow}</p><h3>${item.title}</h3><p>${item.copy}</p><div class="experience-features">${item.features.map(feature => `<article><span class="feature-icon">${icon(feature.icon)}</span><div><h4>${feature.title}</h4><p>${feature.copy}</p></div></article>`).join('')}</div></div>
      ${item.screen ? `<figure class="experience-screen">${phone(item.screen)}<figcaption>Actual Android screen · Demo data</figcaption></figure>` : saleArt()}
    </section>`).join('')}</div>
  </div>`;
}

export function gallery() {
  return `<div class="screen-gallery" role="region" aria-label="SPoT app screens. Scroll horizontally to explore." tabindex="0">${screens.map((item, index) => `<figure><a href="resource/app/screens/${item.key}.png" data-gallery data-title="${escape(item.title)}" data-caption="${escape(item.caption)}" aria-label="Enlarge: ${escape(item.title)}"><div class="gallery-screen"><img src="resource/app/screens/${item.key}.png" width="1080" height="2160" loading="lazy" decoding="async" alt="${escape(item.alt)}"><span class="expand-screen">${icon('expand')}<span class="sr-only">Enlarge screenshot</span></span></div></a><figcaption><span class="screen-number">0${index + 1}</span><h3>${item.title}</h3><p>${item.caption}</p></figcaption></figure>`).join('')}</div>
    <dialog class="screen-dialog" id="screen-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-caption">
      <div class="dialog-header"><div><p class="eyebrow">INSIDE THE ANDROID APP</p><h2 id="dialog-title">App preview</h2></div><button class="icon-button" type="button" data-close aria-label="Close screenshot" autofocus>${icon('close')}</button></div>
      <div class="dialog-image"><img data-dialog-image width="1080" height="2160" alt=""></div>
      <div class="dialog-footer"><div><p id="dialog-caption"></p><p class="fine-print" data-counter role="status" aria-live="polite"></p><a class="original-image-link" data-original target="_blank" rel="noopener noreferrer">Open original image<span class="sr-only"> (opens a new tab)</span></a></div><div class="dialog-controls"><button class="icon-button" type="button" data-previous aria-label="Previous screenshot">${icon('left')}</button><button class="icon-button" type="button" data-next aria-label="Next screenshot">${icon('right')}</button></div></div>
    </dialog>`;
}
