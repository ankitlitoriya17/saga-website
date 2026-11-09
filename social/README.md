# SPoT — free Facebook + Instagram automation

This is a deterministic, template-based social publisher (no paid AI calls). Seven
branded square JPEG cards (1080 × 1080) use SPoT's existing logo and website palette.
A daily GitHub Actions job chooses a weekday topic in India and publishes through
the official Meta Graph API only after explicit activation.

## Safety and duplicate protection

- The repository Actions **variable** named SPOT_SOCIAL_LIVE must equal true.
  Otherwise every schedule and manual run is **DRY RUN**.
- Manual "Run workflow" defaults to **live=false** even after scheduled posting
  has been enabled. Check **live=true** only for an intentional public post.
- Pull requests never receive Meta credentials and cannot publish.
- Each platform is claimed in **social/state.json** and committed before the first
  mutating Meta call. Pending/unknown outcomes are not automatically retried.
- Confirmed IDs and error statuses appear in social/state.json, in this public
  website repository. **Never store access tokens or user data here.**
- This automation does not read Firebase, properties, tenants, or the Android app.

## Meta prerequisites

1. Create a Meta Developers app with the Instagram API **with Facebook Login**
   configuration, for a Facebook Page linked to an Instagram Professional
   (Business or Creator) account. A personal Instagram account is unsupported.
2. Obtain your Facebook **Page access token** with permission to publish to
   that Page (including pages_manage_posts).
3. For Instagram via Facebook Login, use the linked IG Professional account ID,
   instagram_basic, instagram_content_publish, pages_show_list and
   pages_read_engagement as needed.
4. Ensure your Meta app's mode, roles and any required permission review are
   appropriate for the accounts you manage. Access tokens can expire or be revoked.

Meta official API collection:
https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

## GitHub setup (this website repository)

Go to Settings → Secrets and variables → Actions.

| Kind | Key | Value |
| --- | --- | --- |
| Secret | FB_PAGE_ID | Facebook Page numeric ID |
| Secret | FB_PAGE_TOKEN | Page token with Page post permission |
| Secret | IG_USER_ID | Linked Instagram Professional numeric ID |
| Secret | IG_PAGE_TOKEN | Optional IG-capable Page token; fallback is FB_PAGE_TOKEN |
| Variable | META_GRAPH_VERSION | Optional, default v27.0 |
| Variable | SPOT_SOCIAL_LIVE | Set to true **only after verifying previews** |

Configure either platform alone or both. This implementation uses Instagram API
**with Facebook Login** at graph.facebook.com; standalone Instagram Login tokens
are not interchangeable with these calls. Never paste tokens into chat, commits,
issues or public logs. Rotate/renew tokens before expiry.

## Deployment checklist

1. Merge the feature pull request into main after workflow checks pass.
2. Open Actions → SPoT social auto-post → Run workflow, leave live=false.
3. Download the "spot-social-artwork" artifact and review the seven JPEG images
   and the dry-run captions in the job summary.
4. Add the Meta secrets, verify correct account permissions and identifiers.
5. Set the variable SPOT_SOCIAL_LIVE=true; manually run live=true on main to
   authorise the **first actual Facebook/Instagram post**.
6. The first live run commits the generated images so they become public
   at https://spot.apnasheher.com/social/images/ . The code verifies that
   the chosen image is accessible before any Meta publishing request.
7. The schedule runs at 7:00 PM Asia/Kolkata every day. GitHub scheduled
   workflows can start late or occasionally be missed.
8. Check the Actions job summary and social/state.json statuses each day.

When a channel shows needs_review, inspect its real social account and Meta
container state BEFORE changing any state entry. Do not blindly delete entries
and retry because Meta may have published despite a network error.

### Editing content

Edit social/posts.json to update English artwork headlines, Hinglish captions
and hashtags. Run the workflow in dry-run mode first. The artwork generator is
scripts/generate-social-images.py, which uses Pillow and existing SPoT branding.
Generated images are static templates, not fabricated property listings.
The campaign recycles weekly. Add fresh posts regularly to avoid repetition.

## Cost and limits

Standard GitHub-hosted Actions in a public repo, GitHub Pages hosting and Meta
organic publishing API usage do not require a paid social scheduler. Meta API
permissions and limits still apply. This is *not* paid AI generation.

### Tests

- npm test verifies calendar selection, opt-in, duplicate prevention and captions.
- The workflow checks the full website and JPEG dimensions/format.
- Live publishing remains unverified until Meta credentials are configured and
  a user-authorised live post succeeds.
