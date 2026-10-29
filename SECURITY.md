# Security boundaries and publication checks

## Implemented locally

- Same-origin scripts, styles and images; no CDN fonts, external JavaScript or trackers.
- Meta CSP denies unspecified resources, inline code, backend connections, objects,
  base URL overrides and form submissions. The deletion action uses an explicit,
  encoded `mailto:` navigation with a fixed recipient and subject.
- No user-controlled HTML insertion. Inputs are bounded and browser validated;
  template text goes into a textarea or clipboard, never HTML.
- No personal data persistence, automatic email sending or false deletion receipt.
- Shared generated layout and configuration keep security policy and links consistent.

## Before publication

1. **Preserve current deployment files.** The update integrates the current production
   branch and retains property-link fallback and Android association files unchanged.
   Preserve these files on future updates; do not replace the published tree blindly.
   Otherwise shared property links and Android verified links may stop working.
2. **Review privacy disclosures with the service owner.** The existing policy still
   mentions Supabase, vehicle documents and January 2026 terms. Its body was retained
   to avoid inventing legal commitments. Compare it against current service usage,
   retention practices and the Play Data safety declaration. Stale disclosures can
   mislead users. Any revised policy and PDF must agree before either is published.
3. **Verify production HTTPS and headers.** GitHub Pages does not provide a repository
   file mechanism for arbitrary response headers. Meta CSP cannot enforce
   `frame-ancestors`, and cannot set HSTS, `X-Content-Type-Options` or Permissions-Policy.
   The preview server sets some headers only for local QA. If stronger host-level
   controls are needed, configure the existing supported edge/host separately.
   Without a response `frame-ancestors` policy, anti-framing protection is unverified.
4. **Check real browsers.** Review 320px mobile through wide desktop, 200% text zoom,
   keyboard focus, screenshot scrolling, FAQ expansion, JavaScript disabled, CSP
   console errors and actual mail client handling. Clipboard fallback has automated
   coverage; real mail delivery and support processing are not automated.
5. **Keep web access scoped.** This site introduces the app. If live listings are
   added later, use a bounded public DTO and server-enforced publication eligibility.
   Never expose tenant documents, phone numbers, applications, UID mappings or
   privileged credentials in a frontend bundle. Browser-side hiding is not access
   control. This update adds no Firebase client or production-data connection.

## Verification performed

Node tests cover local asset/link integrity, CSP contracts, absence of inline code,
mail header/query injection, invalid-input handling, clipboard denial and stale-data
clearing, plus real local HTTP routing and traversal/write rejection. Generation
checks detect source/output drift. The original policy text was compared against
the Git baseline. Browser rendering, production headers, verified Android App Links
and actual support processing require their own evidence.
