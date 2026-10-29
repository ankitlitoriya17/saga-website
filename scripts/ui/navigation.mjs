export function initNavigation(document, window) {
  const menu = document.querySelector('.mobile-navigation');
  if (menu) {
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) menu.open = false;
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  }
  if (!window.IntersectionObserver) return;
  const links = [...document.querySelectorAll('[data-nav]')];
  const sections = [...new Set(links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean))];
  if (!sections.length) return;
  const visible = new Set();
  const observer = new window.IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id));
    const active = sections.find(section => visible.has(section.id))?.id;
    links.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
}
