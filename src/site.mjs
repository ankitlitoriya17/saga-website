// Public site configuration. Never add service credentials or private user data.
export const site = Object.freeze({
  name: 'SPoT',
  origin: 'https://spot.apnasheher.com',
  playUrl: 'https://play.google.com/store/apps/details?id=com.apnaghar.saga',
  supportEmail: 'apnagharapnasheher@gmail.com',
  themeColor: '#101312',
  publisher: 'Apna Sheher',
  // Cloudflare Web Analytics (cookieless). The site token is public by design.
  analytics: { src: 'https://static.cloudflareinsights.com/beacon.min.js', token: '6edd351065834147aa5f910334df8116' },
  locale: 'en_IN',
  socialImage: { file: 'resource/app/social-preview.png', width: 1200, height: 630, alt: 'SPoT app to rent, buy or sell property and manage tenants and rent records.' },
  navigation: [
    { id: 'renters', label: 'Rent' },
    { href: 'buy-sell/', label: 'Buy &amp; Sell' },
    { href: 'landlords/', label: 'For landlords' },
    { href: 'qr-poster/', label: 'QR poster' },
    { id: 'inside', label: 'Inside the app' },
  ],
});

// GitHub Pages supports the meta form below. frame-ancestors requires an HTTP
// response header; do not claim this meta policy prevents framing.
export const contentSecurityPolicy = "default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self'; font-src 'self'; connect-src https://cloudflareinsights.com; object-src 'none'; base-uri 'none'; form-action 'none'";

export const pages = [
  { file: 'index.html', title: 'SPoT | Rent, buy or sell property in one app', description: 'Rent homes, rooms, PGs and shops. Buy or sell houses, flats, plots and land. Manage tenants and rent records. SPoT for Android, in English and Hindi.' },
  { file: 'buy-sell/index.html', stylesheet: 'styles/landlords.css', title: 'Buy & Sell Property: Houses, Flats, Plots & Land | SPoT', description: 'Browse houses, flats, shops, plots and land for sale, chat with the owner, book a site visit and check an EMI estimate. Or list your property for sale on SPoT.' },
  { file: 'landlords/index.html', stylesheet: 'styles/landlords.css', title: 'Landlord App for Tenant & Rent Management | SPoT', description: 'List rental properties, manage tenants, track rent records and request a rent agreement with SPoT for Android. Property aur kiraye ka hisaab, ek jagah.' },
  { file: 'qr-poster/index.html', stylesheet: 'styles/landlords.css', title: 'QR To-Let Poster & Printed Board for Landlords | SPoT', description: 'Turn your SPoT listing into a QR To-Let poster, or order a printed board for ₹999 cash on delivery. Scan karein, property dekhein.' },
  { file: 'career.html', title: 'Careers | SPoT', description: 'Connect with the SPoT team about opportunities to make renting, buying and selling property simpler.' },
  { file: 'privacy.html', title: 'Privacy Policy | SPoT', description: 'Read the SPoT privacy policy and find privacy and account support.' },
  { file: 'delete-account.html', noindex: true, title: 'Request account deletion | SPoT', description: 'Prepare an account deletion email for the SPoT support team.' },
];

// Directory indexes work on GitHub Pages without a rewrite or client router.
export const pagePath = page => `/${page.file.replace(/(^|\/)index\.html$/, '$1')}`;
