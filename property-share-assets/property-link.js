/* No Firebase SDK, network fetches, cookies, storage, or analytics. */
(function (root) {
  'use strict';
  function validId(id) {
    return id.length > 0 && id.trim() === id && !/^\s*$/.test(id) &&
      id !== '.' && id !== '..' && !/^__.*__$/.test(id) &&
      !/[\/\\\u0000-\u001f\u007f-\u009f]/.test(id) &&
      new TextEncoder().encode(id).length <= 1500 &&
      new TextDecoder().decode(new TextEncoder().encode(id)) === id;
  }
  function parseLink(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname !== 'spot.apnasheher.com' ||
          url.username || url.password || url.port || url.hash) return null;
      let id;
      if (url.pathname === '/property/' || url.pathname === '/property/index.html') {
        const query = url.search.slice(1);
        if (!query.startsWith('propertyId=') || query.includes('&')) return null;
        id = decodeURIComponent(query.slice('propertyId='.length).replace(/\+/g, ' '));
      } else {
        if (!url.pathname.startsWith('/property/') || url.search) return null;
        const raw = url.pathname.slice('/property/'.length);
        if (raw.includes('/')) return null;
        id = decodeURIComponent(raw);
      }
      if (!validId(id)) return null;
      const encoded = encodeURIComponent(id).replace(/[!'()*]/g, char =>
        '%' + char.charCodeAt(0).toString(16).toUpperCase());
      return { id, canonical: 'https://spot.apnasheher.com/property/?propertyId=' + encoded,
        app: 'saga://property/' + encoded };
    } catch (_) { return null; }
  }
  function mount(document, location, navigator) {
    const link = parseLink(location.href);
    const status = document.getElementById('status');
    if (!link) {
      status.textContent = 'This property link is invalid. Ask the sender to share it again, or explore rentals in SPoT.';
      return;
    }
    const open = document.getElementById('open-app');
    open.href = link.app;
    open.hidden = false;
    document.getElementById('reference').hidden = false;
    const input = document.getElementById('property-reference');
    input.value = link.canonical;
    status.textContent = 'Open the shared property in SPoT, or install the app and return to this link.';
    document.getElementById('copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(link.canonical);
        status.textContent = 'Property link copied. Keep it for after installation.';
      } catch (_) {
        input.focus(); input.select();
        status.textContent = 'Select and copy the property link above.';
      }
    });
  }
  if (typeof module !== 'undefined') module.exports = { parseLink, validId, mount };
  if (root.document) mount(root.document, root.location, root.navigator);
})(typeof window === 'undefined' ? globalThis : window);
