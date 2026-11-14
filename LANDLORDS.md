# Landlord landing page handoff — 14 November 2026

`/landlords/` implementation aur local browser QA complete hai. User ne follow-up
mein remaining checks, push aur existing GitHub Pages deployment authorize kiya.
Publication receipt final task response mein rahega. Firebase, Android release,
social publishing aur kisi user ko contact karna is release ka hissa nahi hai.

## Discovery aur baseline

- Website repo `ankitlitoriya17/saga-website`, default branch `main`, verified
  snapshot `256b88cdbadedf519573f143b109d2a17493fc7f`.
- Android reference `ankitlitoriya17/SAGA`, branch `master`, verified snapshot
  `e32358d520762759a40d646d5e34d1c0d43f0b19`.
- Existing website checkout purana tha aur usmein unrelated property-sharing
  changes the. Unhe preserve karne ke liye latest remote main se detached local
  worktree `saga-website-landlords` banaya; original checkout update nahi kiya.
- Previous changes inspect kiye: `75521cc` Play CTAs; `65749b1` app alignment,
  static security aur metadata; `89ea89d` brand/components; `f525303` responsive
  hero overlap fix; `f694b76` property fallback. Latest social scheduling fixes
  `8f571cc` / `8f284cb` present hain aur untouched hain.
- README, site configuration, page sources, showcase catalogue, components,
  build/preview/production scripts, metadata, CSS aur tests inspect kiye.
- Baseline: 40 tests passed. Initial `npm run check` mein generated homepage
  stale report hua; requested build ke baad generated output current hai.

## Claims: Android source evidence

Paths Android repo ke `app/src/main/java/com/apnaghar/saga/` ke relative hain.
References upar pinned `master` se read kiye; dirty Android edits evidence nahi hain.

| Page claim | Source evidence |
| --- | --- |
| Property details, photos, units, rent aur listing visibility | `ui/dashboard/landlord/LandlordViewModel.kt`: property form updates, `addUnit`, `updateUnitRent`, `submitProperty`, `setListingVisibility`; `domain/property/model/Property.kt` |
| Applications aur accepted applicant conversation | `LandlordViewModel.kt`: application feed and `openApplicationConversation`; `ui/tenant/AGENTS.md`: accepting enables messaging, tenancy explicit Add Tenant se start hoti hai |
| Add tenant, assign unit, rent aur move-in details | `ui/tenant/management/TenantViewModel.kt`: tenant form and `onAddTenantSubmit`; `screen/TenantScreen.kt`: AddTenantSheet |
| Active/past records aur payment history | `TenantScreen.kt`: active/past cards, history selection; `TenantViewModel.kt`: history billing observations |
| Rent records aur approval | `TenantViewModel.kt`: `recordPayment`, `setPaymentApproval`; `components/TenantPaymentsSection.kt`: pending/approved presentation; `domain/tenant/logic/TenantLedgerCalculator.kt`: pending amount distinct from approved paid amount |
| Advances, electricity aur eligible receipts | `TenantViewModel.kt`: advance/electricity actions and `onGenerateReceiptRequested` filters `receiptEligible`; `domain/tenant/repository/TenantRepository.kt` |

Live [Google Play listing](https://play.google.com/store/apps/details?id=com.apnaghar.saga)
14 November 2026 ko verify ki: **SPoT: Rent & Property Manager**, developer
**apnasheher**. Android `app/build.gradle.kts` ka applicationId bhi
`com.apnaghar.saga` hai. Listing payment tracking ko payment gateway se clearly
alag batati hai. Har Play CTA existing `site.playUrl` reuse karta hai; referral
ya campaign parameters add nahi hue.

Source support production-installed app ke har flow ka live device proof nahi hai.
Existing dashboard/tenants/rent screenshots unchanged reuse hue, fictional demo
labels ke saath. Inka historical provenance existing README mein hai; original
`playstore/raw/` captures pinned master par available nahi the, isliye fresh
Android-to-image byte parity establish nahi hui.

## Changed files

| Files | Change |
| --- | --- |
| `src/pages/landlords/index.html`, `landlords/index.html` | English/Hinglish source aur generated static page; listing, tenants, rent records, setup steps, seven native FAQs and Play CTAs |
| `styles/landlords.css` | Existing brand tokens ke saath scoped responsive layout; no shared style redesign |
| `src/site.mjs` | Unique title/description, page catalogue entry, landlord navigation and shared public-path function |
| `src/components.mjs`, `src/public-assets.mjs` | Existing phone component mein relative asset prefix; landlord CSS asset registration |
| `scripts/build.mjs` | Nested directory output, relative shared links/assets, screenshot substitution, shared navigation/footer |
| `scripts/serve.mjs`, `scripts/verify-production.mjs` | Same page catalogue se canonical directory route resolve/check karna |
| `src/pages/index.html`, `index.html` | Existing owner section se contextual landlord link |
| `career.html`, `privacy.html`, `delete-account.html` | Regenerated shared navigation/footer and asset version; main content unchanged |
| `tests/landlords.test.mjs`, `tests/security.test.mjs` | SEO/CTA/static-host/no-JS contracts and nested links/security coverage |
| `README.md`, `LANDLORDS.md` | Development aur handoff documentation |

## SEO rationale aur expected impact

- Title: **Landlord App for Tenant & Rent Management | SPoT**. Description mein
  listings, tenant management aur rent records ka clear intent hai; Hinglish
  explanation Indian owners ko everyday workflow samjhati hai.
- Single H1, descriptive sections aur useful FAQs rendered HTML mein hain.
  Search crawler ya visitor ko content ke liye JavaScript nahi chahiye.
- Canonical aur Open Graph URL dono
  `https://spot.apnasheher.com/landlords/` hain; direct `index.html` version bhi
  isi directory URL ko canonical rakhta hai.
- Header, mobile menu, footer aur homepage owner section se crawlable internal
  links hain. Separate language duplicate URLs ya invented ratings/reviews,
  statistics, testimonials, vacancy promises, FAQ rich-result promises nahi hain.
- Expected impact: landlord queries ke liye relevant landing destination aur
  clearer install decision. Ranking, enquiries ya installs ki uplift measured
  nahi hai; koi numerical growth guarantee nahi hai.

## Verification aur limits

- `npm run build`: PASS, five public pages generated.
- `npm run check`: PASS, output current.
- `npm test`: PASS, 44/44 tests, including existing social/property tests.
- `git diff --check`: PASS.
- Local preview `/landlords/`: HTTP 200. Independent plain directory-index
  hosting test mein page aur relative links/assets HTTP 200, without rewrites.
- Automated checks: unique title/description/canonical/OG, Play package,
  navigation fragments, image dimensions/alt, external link safety, same CSP,
  no executable inline content/backend calls/storage, native FAQ markup and
  complete no-JS page content.
- Career, privacy aur account deletion ke existing main bodies baseline se
  equal hain. Property deep-link files, association JSON, domain, advertising
  declaration, `.nojekyll`, shared CSS aur showcase catalogue untouched hain.
- Browser QA: VS Code integrated Chromium mein desktop aur requested emulation
  widths 320, 375, 580, 850, 1100, 1440px inspect kiye. Hero copy, CTA aur
  screenshot mein visible overlap nahi mila; mobile FAQs readable hain.
- Keyboard: visible skip link se main content aur next main link tak focus
  progression; mobile menu Space se open aur Escape se focus restore; FAQ
  Space/Enter toggles inspect kiye. Browser page zoom 200% par reflow inspect
  kiya, phir 100% restore kiya.
- DevTools se JavaScript disable kiya, `Enable JavaScript` command se disabled
  state confirm ki, page reload kiya. Content, native menu aur keyboard FAQ
  script ke bina usable rahe. Yeh real rendered Chromium checks hain; physical
  Android, Firefox aur TalkBack verification nahi.
- Lighthouse/Core Web Vitals, Play-installed app behavior aur search indexing
  verify nahi hue. Live deployment verification publication ke baad hoti hai.

## Privacy aur preservation

Page static hai. New JavaScript, dependency, form, cookie, persistent browser
storage, tracker, paid API, Firebase SDK ya Firebase operation add nahi hua.
Styles, fonts aur screenshots same-origin hain; CSP `connect-src 'none'` aur
`no-referrer` preserve hue. App ki privacy disclosures aur website page behavior
alag hain; existing app privacy policy body change nahi ki.

## Deployment checklist

1. `npm start` se local preview kholein. Chrome/Firefox aur Android browser mein
   320, 375, 580, 850, 1100 aur 1440px widths, 200% text zoom aur overflow check
   karein. Hero caption normal flow mein rahe; copy/screenshots overlap na hon.
2. Keyboard-only: skip link, visible focus, mobile menu, anchors, all FAQs using
   Enter/Space, and Play CTA verify karein. JavaScript disable karke repeat
   karein; content, native menu aur FAQs usable rehne chahiye.
3. Homepage tabs/gallery, careers, privacy, deletion controls aur property query
   fallback smoke-test karein. Browser console/CSP aur Network panel mein sirf
   expected local assets verify karein. Checks skip karne par visual/focus
   regressions aur broken assets undetected reh sakte hain.
4. Latest main changes review/reconcile karein; source ke saath generated
   `landlords/index.html`, existing regenerated
   pages aur CSS include karein. CNAME, Pages root source, `.nojekyll`, property
   routes aur `.well-known/assetlinks.json` retain karein. Build/check/tests rerun
   karein. Generated files skip karne par GitHub Pages stale output serve karega.
5. Publication ke baad HTTPS `/landlords/` 200, assets, canonical, CTA, all
   existing routes, property fallback aur association JSON verify karein. Tab
   `npm run verify:production` run karein; yeh committed bytes se compare karta
   hai, current unpublished worktree ko production proof nahi banata.

Optional later: organic search impressions/clicks se impact review karein if
existing read-only Search Console access available ho. Is page mein tracking
add karne ki zaroorat nahi. SEO outcome review skip karne se growth impact
unmeasured rahega.
