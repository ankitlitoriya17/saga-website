// Local email preparation only. No network requests, persistence, or success claims.
const form = document.getElementById('deletion-form');
const result = document.getElementById('result');
const fallback = document.getElementById('manual-template');
const templateField = document.getElementById('email-template');
const supportEmail = document.querySelector('.content-panel a[href^="mailto:"]').getAttribute('href').slice(7);
const subject = 'Account Deletion Request – SPoT';

function prepare() {
  if (!form.reportValidity()) return null;
  // Bound lengths even when DOM constraints are altered; keep headers fixed.
  const email = form.elements.email.value.trim().slice(0, 254).replace(/[\r\n]/g, '');
  const notes = form.elements.notes.value.trim().slice(0, 1000);
  const body = `Hello SPoT team,\n\nI would like to request deletion of my SPoT account.\n\nRegistered email address: ${email}\n\n${notes ? `Notes: ${notes}\n\n` : ''}Please confirm the verification steps, processing timeline and any applicable data retention.\n\nThank you.`;
  return { body, text: `To: ${supportEmail}\nSubject: ${subject}\n\n${body}` };
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const prepared = prepare();
  if (!prepared) return;
  window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(prepared.body)}`;
  result.textContent = 'Email prepared. If your email app opens, review and send it. If it does not open, use Copy email template. This page cannot confirm delivery.';
});

document.getElementById('copy-template').addEventListener('click', async () => {
  const prepared = prepare();
  if (!prepared) return;
  try {
    await navigator.clipboard.writeText(prepared.text);
    fallback.hidden = true;
    templateField.value = '';
    result.textContent = 'Template copied. Paste it into your email app and send it to the SPoT support team. This page cannot confirm delivery.';
  } catch {
    templateField.value = prepared.text;
    fallback.hidden = false;
    templateField.focus();
    templateField.select();
    result.textContent = 'Automatic copying is unavailable. Copy the template below, then paste it into your email app and send it.';
  }
});

// An old fallback must not retain account details after the user edits them.
form.addEventListener('input', () => {
  fallback.hidden = true;
  templateField.value = '';
  result.textContent = '';
});

// Without JavaScript, controls stay disabled: no accidental GET submission of
// account details even in a browser that does not enforce the meta CSP.
document.getElementById('deletion-fields').disabled = false;
