// Public site configuration. Never add service credentials or private user data.
export const site = Object.freeze({
  name: 'SPoT',
  origin: 'https://spot.apnasheher.com',
  playUrl: 'https://play.google.com/store/apps/details?id=com.apnaghar.saga',
  supportEmail: 'apnagharapnasheher@gmail.com',
  themeColor: '#101312',
  navigation: [
    { id: 'experience', label: 'The experience' },
    { id: 'renters', label: 'For renters' },
    { id: 'owners', label: 'For owners' },
    { id: 'inside', label: 'Inside the app' },
  ],
});

// GitHub Pages supports the meta form below. frame-ancestors requires an HTTP
// response header; do not claim this meta policy prevents framing.
export const contentSecurityPolicy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

export const pages = [
  { file: 'index.html', title: 'SPoT | A place for your next chapter', description: 'Find homes, rooms, PGs and shops. Manage properties, tenants and rent records with SPoT for Android.' },
  { file: 'career.html', title: 'Careers | SPoT', description: 'Connect with the SPoT team about opportunities to improve the rental experience.' },
  { file: 'privacy.html', title: 'Privacy Policy | SPoT', description: 'Read the SPoT privacy policy and find privacy and account support.' },
  { file: 'delete-account.html', title: 'Request account deletion | SPoT', description: 'Prepare an account deletion email for the SPoT support team.' },
];
