# cron-job.org scheduler for SPoT social posting

The GitHub `schedule` trigger has been **removed**: GitHub started scheduled runs
hours late, and runs that crossed midnight IST posted the evening slot at night.
cron-job.org is now the **only** trigger. Configure **daily** jobs that dispatch
the workflow at **07:00 and 19:00 Asia/Kolkata**. (The input is still named
`source=backup` so existing jobs keep working; jobs already set to 07:20/19:20
still work too.)

Optional but recommended: add two **retry** jobs at **07:30 and 19:30** with the
same bodies. They are harmless when the slot is already published (the ledger
skips claimed slots) and cover a single failed or missed dispatch.

The backup always **requests** a GitHub workflow dispatch. It does not inspect
GitHub directly to decide whether to dispatch; the GitHub publisher checks
`social/state.json` and skips channels whose slot is already claimed.
No-repeat SHA-256 logic and the single-branch workflow concurrency also apply.

Backup dispatches are refused outside these windows:
- Morning: **06:55–10:00 IST**
- Evening: **18:55–22:00 IST**

Backups do not bypass the global `SPOT_SOCIAL_LIVE=true` gate. Failed or
uncertain Meta requests with a committed `pending` or `needs_review` entry
are intentionally **not automatically retried**. Inspect these manually.

## 1. Create a restricted GitHub credential

At https://github.com/settings/personal-access-tokens/new create a
**fine-grained** GitHub personal access token:

- Resource owner: the account that owns `ankitlitoriya17/saga-website`
- Repository access: **Only select repositories** → `saga-website`
- Repository permissions: **Actions → Read and write**
- No permission to other repositories, orgs or account data
- Use a limited expiry, and set a reminder to rotate it before expiration

The fine-grained token is **different** from your Meta tokens and must **never**
be committed to the repo, pasted in tickets, chat, or URL query parameters.

GitHub official docs:
https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event

## 2. Create the morning cron-job.org job

Log in at https://console.cron-job.org/ and create a cronjob:

- Title: `SPoT Morning Post`
- URL (same for both jobs):
  `https://api.github.com/repos/ankitlitoriya17/saga-website/actions/workflows/spot-social.yml/dispatches`
- Method: `POST`
- Schedule timezone: **Asia/Kolkata**
- Every day at **07:00**
- Request headers:
  - `Authorization`: `Bearer YOUR_FINE_GRAINED_GITHUB_PAT`
  - `Accept`: `application/vnd.github+json`
  - `Content-Type`: `application/json`
  - `X-GitHub-Api-Version`: `2022-11-28`
- Request body (raw JSON):

```json
{"ref":"main","inputs":{"slot":"morning","source":"backup","live":"true"}}
```

Replace the placeholder in the **Authorization header only**, inside your
cron-job.org account. Never put the token in the URL or JSON body.

## 3. Create the evening job

Create a second job with the **same URL and headers**:

- Title: `SPoT Evening Post`
- Schedule timezone: **Asia/Kolkata**
- Every day at **19:00**
- POST body:

```json
{"ref":"main","inputs":{"slot":"evening","source":"backup","live":"true"}}
```

Enable failure notifications in cron-job.org. Ensure the jobs are enabled only
after the credential, request method, timezone and body are reviewed.

## 4. Test without publishing

On cron-job.org use **Run now** outside the permitted morning/evening window.
A successful HTTP result (usually 200 on recent GitHub APIs, or 204 on older
API versions) means the dispatch was accepted — **not** that Meta posted.

Then inspect GitHub Actions → SPoT social auto-post:

- `workflow_dispatch` should appear;
- the run summary must say `BACKUP SKIPPED: outside approved ... IST window`;
- no Facebook/Instagram post should be created.

If tested during a permitted window, the job may publish the pending slot when
`SPOT_SOCIAL_LIVE=true`. For a nonposting test **temporarily set
SPOT_SOCIAL_LIVE=false** and restore it only after verification.

## 5. Ongoing verification

After the primary 7 AM / 7 PM window, check the actual state file:

`https://github.com/ankitlitoriya17/saga-website/blob/main/social/state.json`

For each date, look under `morning` and `evening`, then `facebook` and
`instagram` for `status: published`. Cron-job.org seeing HTTP success
does **not** itself prove the social post was created. Check the GitHub Actions
run and the actual social account for completion.

If cron-job.org reports:
- **401** → missing/expired/malformed token
- **403** → token permission or repository access problem
- **404** → invalid repo/workflow path or private access
- **422** → invalid dispatch input, branch or inactive workflow

### Limits

cron-job.org dispatches on time as long as the GitHub workflow-dispatch API and
Actions runners are working. There is **no second scheduler** any more, so keep
cron-job.org failure notifications on, rotate the GitHub token before it expires
(an expired token means silent 401s and no posts), and check `social/state.json`
daily for the first week.

It **does not** protect against a total GitHub API/Actions outage, expired
Meta credentials, GitHub Pages unavailability, or Meta publishing failures.
The third-party cron service necessarily processes the restricted GitHub token
as a request header; apply least privilege and rotate it.

Do not add a GitHub `schedule` back unless it is guarded against late starts.

Useful docs:
- https://docs.cron-job.org/creating-cron-jobs.html
- https://docs.cron-job.org/rest-api.html
