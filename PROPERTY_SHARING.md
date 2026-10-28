# Static property fallback

Canonical share URL: `https://spot.apnasheher.com/property/?propertyId=<encoded-id>`.
`property/index.html` is a real static page. GitHub Pages serves it for `/property/`;
the query preserves the property reference without requiring a server-side route or
hosting migration. JS/CSS are under `property-share-assets/`.

The Android manifest already accepts `https://spot.apnasheher.com/property/` prefixes.
The updated app parses the `propertyId` query once, validates it, retains it through sign-in,
and requires an authoritative publicly eligible listing before rendering details. Legacy
`/property/{id}` and `saga://property/{id}` links remain supported by the app. Legacy path
links still lack a GitHub Pages browser fallback; new shares use only the static query URL.

The page provides an explicit `saga://property/{id}` app-open action and a Google Play button.
Users who install the app return to the original message and tap the link again. No automatic
post-install routing is claimed. Unknown/deleted/unpublished IDs get the same generic page;
the app determines availability. No Firestore data, tenant records, cookies, local storage,
or analytics are accessed. Invalid IDs never expose an app-open action.

## Validation

Run `node --test tests/property-fallback.test.cjs` (Node 20 or newer).
The suite covers Unicode/reserved-character round trips, malformed and duplicate queries,
legacy parsing, DOM behavior, clipboard fallback, and real local HTTP 200 responses for
property references and assets on a plain static directory-index server without rewrites.
This is local validation; production CDN behavior and Play-installed App Links need separate QA.

## Deployment sequence

1. Review the website changes. Preserve all existing marketing pages, CNAME, `.nojekyll`,
   and `.well-known/assetlinks.json`. Both existing certificate fingerprints are unchanged.
2. Publish the static additions to the existing GitHub Pages site only when approved.
3. Verify production `/property/?propertyId=fictional-id`, Unicode IDs, invalid IDs and
   both assets return 200 with the expected content. Test desktop and mobile browsers.
4. Verify the existing association file still returns JSON without redirects. The user-supplied
   Play signing certificate `48:55:77:CD:44:CF:93:C7:EE:BF:2B:64:B5:B5:7F:4C:E9:81:8C:EC:09:99:CC:2E:7E:DA:D7:E1:19:91:5B:83`
   already matches its `com.apnaghar.saga` statement. Keep the other fingerprint intact.
5. Test the updated Android build installed through Google Play: cold/warm HTTPS taps,
   signed in/out, deleted/unpublished listings, and installation followed by returning to
   the original message. Require `spot.apnasheher.com: verified` from `pm get-app-links`.
6. Enable `-Psaga.propertyLinksReady=true` only after production fallback and App Links QA.
   Until then Android retains its existing Play-link sharing behavior.

This website update requires no backend, DNS migration, signing-key changes, or database
writes. Android release publication remains a separate step from the website deployment.
