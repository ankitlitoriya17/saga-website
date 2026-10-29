// Anchor links become tabs only after their complete panel mapping is verified.
// Without JavaScript both experiences remain readable, with ordinary anchor links.
export function initTabs(document) {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const list = group.querySelector('[data-tablist]');
    if (!list) continue;
    const tabs = [...list.querySelectorAll('[data-tab]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('href').slice(1)));
    if (!tabs.length || panels.some(panel => !panel)) continue;

    function activate(index) {
      tabs.forEach((tab, position) => {
        const selected = index === position;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[position].hidden = !selected;
      });
    }

    list.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].tabIndex = 0;
      tab.addEventListener('click', event => {
        if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        activate(index);
      });
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          tabs[next].focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(index);
        }
      });
    });
    activate(0);
    group.dataset.enhanced = 'true';
  }
}
