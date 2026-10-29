export function initMotion(document, window) {
  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!window.IntersectionObserver || preference?.matches) return;
  const elements = [...document.querySelectorAll('[data-reveal]')];
  let observer;
  const revealAll = () => {
    observer?.disconnect();
    elements.forEach(element => element.classList.remove('reveal-ready'));
  };
  try {
    observer = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(element => {
      observer.observe(element);
      element.classList.add('reveal-ready');
    });
    preference?.addEventListener?.('change', event => { if (event.matches) revealAll(); });
    window.addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
  } catch {
    revealAll();
  }
}
