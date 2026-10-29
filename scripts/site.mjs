document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = String(new Date().getFullYear());
});
// The generated entry URL carries a digest of all public assets. Forward it to
// child modules so a deployment never mixes an old cached controller with new UI.
const version = new URL(import.meta.url).search;
const [{ initTabs }, { initGallery }, { initNavigation }, { initMotion }] = await Promise.all([
  import(new URL(`./ui/tabs.mjs${version}`, import.meta.url)),
  import(new URL(`./ui/gallery.mjs${version}`, import.meta.url)),
  import(new URL(`./ui/navigation.mjs${version}`, import.meta.url)),
  import(new URL(`./ui/motion.mjs${version}`, import.meta.url)),
]);
initTabs(document);
initGallery(document);
initNavigation(document, window);
initMotion(document, window);
