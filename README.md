# SPoT website

Static marketing and support pages for SPoT by Apna Sheher. The public Android
package remains `com.apnaghar.saga`. The existing GitHub Pages domain is
`spot.apnasheher.com`; `CNAME` and `app-ads.txt` are unchanged.

## Develop

Requires Node 20 or newer. No dependencies, Firebase SDK, API keys, or installation step.

```sh
npm run build
npm run check
npm test
npm start
```

Preview: http://127.0.0.1:4173. The preview server binds only to loopback and is
development tooling, not a production server. Its response headers do not prove
that GitHub Pages supplies the same headers.

Open `index.html` directly for a buildless review. Generated root HTML files are
committed so the current GitHub Pages setup can continue serving the repository root.

## Separation of concerns

- `src/site.mjs`: public URLs, contact details, metadata, shared security policy.
- `src/pages/*.html`: page content. Change these instead of generated root pages.
- `src/showcase.mjs`: one catalogue of app screens and renter/owner experience content.
- `src/components.mjs`, `src/icons.mjs`: build-time components and local SVGs.
- `src/public-assets.mjs`: public asset catalogue shared by serving and deployment checks.
- `scripts/build.mjs`: shared document, header and footer; generates the four root pages.
- `styles/shared.css`: shared responsive styles and brand tokens.
- `scripts/site.mjs`: small browser entry, with individual controllers in `scripts/ui/`.
- `scripts/deletion.js`: on-device email preparation and clipboard fallback.
- `tests/security.test.mjs`, `tests/interactions.test.mjs`: security, keyboard/state contracts,
  no-JavaScript fallbacks, motion preferences, deletion and local HTTP checks.

After editing source content or configuration, run `npm run build`. The check
command detects stale generated pages. Keeping one configuration and one layout
prevents contact details, links and security policies drifting between pages.

## App alignment and assets

The reference app is `C:\Users\Ankit\AndroidStudioProjects\SAGA`.
The current code was inspected on 29 October 2026. Palette values come from
`app/src/main/java/com/apnaghar/saga/core/ui/theme/AppBrand.kt`. The app's
`docs/BRAND_ASSETS.md` identifies the charcoal and ivory ribbon-pin identity.

`resource/app/brand.png` is copied from the app's 192px
`app/src/main/res/mipmap-xxxhdpi/ic_spot_launcher.png`.
The displayed screenshots in `resource/app/screens/` are copied byte-for-byte from
`playstore/raw/`. Each is 1080 × 2160, without the Play Store marketing frame:

| Website file | App source filename |
| --- | --- |
| `discover.png` | `01_property_discovery.png` |
| `details.png` | `02_property_details.png` |
| `dashboard.png` | `03_landlord_dashboard.png` |
| `tenants.png` | `04_tenant_management.png` |
| `rent.png` | `05_rent_tracking.png` |

The app's `playstore/SCREENSHOT_GUIDE.md` and `VALIDATION_REPORT.md` describe their
offline production-Compose capture with fictional data. These are illustrative
screens, not live listings, user records, or proof of service availability. The
screenshots predate this website update; refresh them when the app UI changes.
The older marketing-framed screenshots at `resource/app/*.png` remain available
to preserve any existing links. `living-room.jpg` comes from the app's isolated
`app/src/playstore/assets/rentals/` demo assets and is explicitly illustrative.

Photo provenance is carried over from the app's `playstore/IMAGE_SOURCES.md`:
Pyx Photography ([living room](https://unsplash.com/photos/CgA03H9jCKw)), Gokul
Balasigamani ([room](https://unsplash.com/photos/_c5yyXUBOtg)), and TSI /
plate_stories_tsi ([building](https://unsplash.com/photos/q8BGZsCgGmQ)), under the
[Unsplash License](https://unsplash.com/license). The source repository recorded
its license review on 26 October 2026. No new photo downloads were made here.

## Security and support

The site uses local scripts and styles, self-hosted Outfit fonts with system fallbacks,
no external icon library,
and no analytics, cookies, browser storage or backend reads/writes. All four pages
carry a restrictive meta Content Security Policy and `no-referrer` policy.
No inline executable code is needed. Core navigation, screenshots, FAQs and direct
support email links work without JavaScript.

## Frontend interaction and performance

The dark premium design uses charcoal, ivory and bronze, with restrained olive
surfaces. Components include a responsive mobile menu, renter/owner tabs, a native
dialog gallery, active-section navigation and optional scroll reveals.

The browser entry forwards a generated asset digest to every UI module. The same
digest versions the stylesheet and entry URL, so deployment invalidates cached UI
code together. No hydration framework, animation library, continuous scroll loop,
service worker or persistent browser storage is used.

- Without JavaScript, both experience panels, gallery image links, the native mobile
  menu and FAQ details remain usable. The deletion controls remain safely disabled.
- Tabs use manual keyboard activation with arrow keys, Home/End, Enter/Space and
  linked ARIA panels, following the [WAI tab pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- The [native dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
  supplies modal focus containment and Escape behavior. The gallery restores focus
  on close and preserves ordinary image navigation when dialog is unavailable.
- Reveals use [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
  and reveal immediately for reduced-motion preferences or unsupported APIs.
- Screens reserve their dimensions and load lazily, except the hero screen. Two
  unmodified Outfit weights are self-hosted from the app, with `font-display: swap`.
  Their [SIL Open Font License](resource/fonts/OFL.txt) is included.

Automated interaction tests use a bounded DOM double. They verify controller state
and events, not browser rendering, native focus trapping, touch input or Lighthouse
scores. Those require real browser evidence; do not infer them from passing unit tests.

Layout lesson from the production hero: keep decorative image overlap in its own
visual container. Captions and note cards belong in normal flow with measured gaps;
positioning them against the entire hero caused a visible overlap in a user-supplied
screenshot. Check the 580px, 850px and 1100px breakpoints and text zoom in a real
browser before treating responsive layout as visually verified.

Deletion inputs stay on-device until the user chooses to open their email app or
copy a template. No request is sent to support automatically. The page cannot
verify delivery or completion and never displays a fabricated acknowledgement.
Clipboard denial provides a selectable fallback. Mail client availability and
actual message delivery need manual testing on the target device.

The existing privacy policy body is preserved verbatim apart from whitespace;
this update does not assert that its January 2026 service disclosures are current.
See [SECURITY.md](SECURITY.md) for the remaining publication checks.

## Publish safely

Deploy by pushing the validated generated pages to `main`, the existing GitHub Pages
source at the repository root. Keep `CNAME` set to `spot.apnasheher.com` and retain
the existing DNS configuration. This update does not need a hosting migration.

The update integrates the current production branch and preserves
`.well-known/assetlinks.json`, `property/`, `property-share-assets/` and `.nojekyll`.
Preserve these files in future updates; removing them could break property sharing
and Android link verification.

Keep the existing hosting provider and domain. After publication, check HTTPS,
all four pages and assets, `/property/`, the association JSON, and `app-ads.txt`.
Validate actual response headers and test Android App Links on a Play-installed app
separately. This static website update alone requires no Android release.

After GitHub Pages finishes deploying the current commit, run `npm run verify:production`.
It checks HTTPS 200 responses, content types and SHA-256 equality with committed files
for the pages, app assets, property fallback, association JSON and advertising declaration.
It makes no backend calls and does not substitute for browser or Android device QA.

## Individual property links

`/property/?propertyId=<encoded-id>` serves a real static directory-index page on GitHub
Pages. It offers an app-open action, a Google Play install button, and a copyable property
reference without fetching listing data. See [PROPERTY_SHARING.md](PROPERTY_SHARING.md)
for the Android contract, tests, and deployment sequence. `npm test` runs both the
existing property fallback suite and the new page security tests.
