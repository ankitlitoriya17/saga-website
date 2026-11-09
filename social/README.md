# SPoT — zero-subscription Facebook + Instagram automation

The SPoT website repository hosts an automated, template-driven social publisher.
It creates a **different 1080×1080 JPEG and Hinglish caption** for each scheduled
slot without using paid generative-image or text APIs.

## Schedule (Indian Standard Time)

- **07:00 AM Asia/Kolkata** — morning post
- **07:00 PM Asia/Kolkata** — evening post

Each slot publishes the selected creative to all connected eligible channels
(Facebook Page and/or Instagram Professional). A GitHub Actions schedule is not
an exact-time SLA: GitHub may delay or occasionally skip scheduled events.

## No-repeat design

- A 7-topic bank combines 98 individually authored rental tips and 16 phrasing
  variations to produce **1,568 distinct caption/creative pairs**.
- Two daily posts are different and have unique, date/slot-specific image URLs.
- A content SHA-256 hash, computed from the actual caption content **without date
  or serial numbers**, is checked against the long-term publication ledger
  before publishing. A post cannot become "new" simply by changing its date.
- Each platform/slot is claimed durably before the publishing API request.
  Pending, unknown and unsuccessful statuses never trigger a blind retry.
- Once all **1,568 unique combinations** are used (up to **784 days** at two per
  day starting 9 November 2026), the automation **stops rather than repeats**.
  Replenish the editorial bank before then.
- Broader subjects (rent collection, receipts, listings) naturally recur; exact
  caption/creative combinations do not. Human editorial review remains useful
  to keep related advice fresh and avoid repetitive-sounding campaigns.

The scheduled source is social/posts.json and the curated angles are in
social/angles.json. Each slot's generated artwork is stored as
social/images/YYYY-MM-DD-morning.jpg or social/images/YYYY-MM-DD-evening.jpg.
The no-repeat ledger is social/state.json, public in this public repo and
intended to contain **no tokens, tenant records or other private data**.

## Safe activation

Before any real posting, the repository variable SPOT_SOCIAL_LIVE must equal
true. When unset, every scheduled run is a dry-run. Manual workflow dispatches
also require their separate **live=true** checkbox; this checkbox defaults to
false. Manual runs can preview/publish the morning or evening slot separately.

Pull requests do not publish, and they cannot use publishing credentials.
The workflow checks the site, tests every one of the 1,568 possible post
combinations for uniqueness, prepares the next caption, renders its JPEG, checks
dimensions and uploads a preview artifact. Only a permitted live run first
commits the image to GitHub Pages, waits for the live image URL to respond,
and then attempts to publish through Meta.

## Meta setup

Create a Meta Developers app using **Instagram API with Facebook Login**, and
link an Instagram **Professional** account to a Facebook Page you administer.
For Facebook Page posts use a Page access token with appropriate publishing
permissions (including pages_manage_posts). Instagram via this integration
requires its linked IG Professional numeric ID and the relevant permissions,
such as instagram_basic, instagram_content_publish, pages_show_list and
pages_read_engagement. Account/app roles, Live mode and review requirements
may apply depending on your setup.

Official Meta collection:
https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

In THIS repository go to Settings → Secrets and variables → Actions:

| Type | Key | Purpose |
| --- | --- | --- |
| Secret | FB_PAGE_ID | Facebook Page numeric ID |
| Secret | FB_PAGE_TOKEN | Facebook Page publishing token |
| Secret | IG_USER_ID | Linked Instagram Professional ID |
| Secret | IG_PAGE_TOKEN | Optional Instagram-capable Page token, defaults to FB_PAGE_TOKEN |
| Variable | META_GRAPH_VERSION | Optional Graph API version, default v27.0 |
| Variable | SPOT_SOCIAL_LIVE | Set to true **only when ready to make public posts** |

Do not paste token values into issues, commits, chat or logs. Tokens may expire
and require renewal. This implementation does **not** support personal Instagram
accounts or standalone Instagram Login tokens.

## Operating procedure

1. Review and merge a change to this feature, after Actions tests pass.
2. Open Actions → SPoT social auto-post → Run workflow; choose **morning** or
   **evening**, leave **live=false**, and inspect caption + downloaded artwork.
3. Configure Meta IDs and secrets; confirm correct permissions.
4. Set SPOT_SOCIAL_LIVE=true and deliberately run **live=true** for one slot.
   Confirm a real post appeared on each connected account before relying on
   automated scheduling. Both schedule events will then be enabled for live
   posting at the configured local hours.
5. Monitor Actions summaries and social/state.json for missing events and
   statuses such as needs_review. Investigate a suspected post directly on
   Meta before modifying the ledger; a timeout may occur after successful
   publishing.

A daily run has one post **per platform per slot**, not multiple copies on the
same platform. If an account lacks API permissions it will not be published.
No app/Firebase data is accessed. The content library contains helpful general
advice and only SPoT features documented in the app's marketing material.

## Costs and limitations

This does not require a paid social scheduler or paid AI generation. GitHub
Actions/Pages free-use policies and Meta API limitations still apply. Two
scheduled workflows create two preview artifacts and, only when enabled, up to
two new public images/day. Automated posts cannot guarantee user growth.
Keep the content library and Meta account permissions up to date.

Run npm test and verify the GitHub Actions PR check before deploying.
