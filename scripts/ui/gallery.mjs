export function initGallery(document) {
  const dialog = document.getElementById('screen-dialog');
  const links = [...document.querySelectorAll('[data-gallery]')];
  if (!dialog || typeof dialog.showModal !== 'function' || !links.length) return;
  const image = dialog.querySelector('[data-dialog-image]');
  const title = document.getElementById('dialog-title');
  const caption = document.getElementById('dialog-caption');
  const counter = dialog.querySelector('[data-counter]');
  let current = 0;
  let opener;

  function display(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    image.src = link.href;
    dialog.querySelector('[data-original]').href = link.href;
    image.alt = link.querySelector('img').alt;
    title.textContent = link.dataset.title;
    caption.textContent = link.dataset.caption;
    counter.textContent = `Screen ${current + 1} of ${links.length} · Fictional demo data`;
  }

  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    display(index);
    dialog.showModal();
    document.documentElement.classList.add('dialog-open');
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-next]').addEventListener('click', () => display(current + 1));
  dialog.querySelector('[data-previous]').addEventListener('click', () => display(current - 1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      display(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
    opener?.focus();
  });
}
