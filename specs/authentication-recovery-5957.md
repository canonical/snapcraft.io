# Issue #5957: authentication recovery validation, 2026-11-03 UTC

## Verdict

The existing local fix passes deterministic offline regression tests for the
exact `401 / unauthorized / Exchange window expired` error. This error was NOT
observed live. Live expiry recovery, the intended account page after live
reauthentication, and the issue reporter's root cause remain unverified.

A fresh production Ubuntu One login worked against production and the local app.
The dedicated QA account has a verified SSO email but has NOT accepted the Snap
Store Developer Programme Agreement. Preserve this state: do not submit the
agreement, edit its profile, rotate its password, delete it, or provision Store
resources just to obtain a successful account page. The agreement was unchecked
and Continue disabled in both browser contexts at 18:20:57–18:20:58 UTC.

## Sources and scope

- https://github.com/canonical/snapcraft.io/issues/5957 (read with `gh issue view`).
  Reports account-page failure and separate email/password-recovery problems;
  does not establish exchange expiry as the cause. The reporter's account was
  not accessed and no password-recovery messages were sent to that person.
- Browser document-request statuses and rendered pages, via Chrome DevTools MCP.
- Local runtime endpoint inspection, app logs, source and offline tests.
- No production backend logs, Sentry events or deployed revision were inspected.
- Two named Chromium isolated browser contexts were used, one for production
  and one for local. Cookies/storage are isolated; these are NOT separate
  on-disk Chrome user-data profiles or independent browser processes.

## Production first

Anonymous HTTP comparison, 18:04:07–18:04:16 UTC:

```
GET https://snapcraft.io/admin/account         302
GET /login?[redacted]                         302
GET https://login.ubuntu.com/+openid?[redacted] 302
GET /[SSO flow ID]/+decide                     200
```

Browser phase began at 18:05:46 UTC. After an initial browser-profile lock was
resolved by the operator, the isolated production context reached real SSO.
At the operator's request, a password-protected disposable mailbox was created
with https://mail.tm/ and one Ubuntu One QA account was registered. Ubuntu One
signup terms were accepted with explicit authorization. The operator completed
the email-verification CAPTCHA; it was not bypassed.

By 18:11:22 UTC the browser was authenticated and on the Store agreement page:

```
POST https://login.ubuntu.com/[SSO path] 302
GET  https://login.ubuntu.com/[SSO path] 200
POST https://snapcraft.io/login?[redacted] 302
GET  https://snapcraft.io/account/agreement 200
GET  https://snapcraft.io/admin/account 404 (18:11:34 UTC)
```

No Store agreement was submitted. A bounded follow-up at 18:16:12–18:16:15 UTC
again returned 404 for `/admin/account`, not 502. These observations do not prove
that expiry is absent or that waiting caused expiry. Production upstream error
codes cannot be established from the browser's generic 404 alone.

## Actual local app, real production backends

Checkout HEAD: `f9e8c7fdb4a1dc9b7c2a62c4b801286348b8bf2e`.
The pre-existing change tested is `webapp/handlers.py`: the global error-list
handler resets authentication and redirects to `/login?next=<request path>` for
one exact error with HTTP 401, code `unauthorized`, and message
`Exchange window expired`, in addition to its existing macaroon-error handling.
It does not classify arbitrary unauthorized errors as recoverable.

- Handler file SHA256:
  `1bb7a80e84937f316132a544c12da4c1fbfc1f6b42b80b3ad185454ee498599c`
- `git diff --binary -- webapp/handlers.py` SHA256:
  `445a612957f8d4f64666aa2f869311cd4ce98622ebb3c4a89625cbc1b94de9ae`
- Existing untracked regression test SHA256:
  `6c3c4e889cf1f9acbf8bcb1a3aa35cdcbe7d38569f91b79054046f160152022c`

`dotrun exec yarn build` succeeded before app/tests. The actual documented
`dotrun` workflow started Vite and Gunicorn at 18:12:32 UTC (Gunicorn ready
18:12:34). No mock server, fabricated browser session, cookie extraction,
redirect-registration change or TLS-verification bypass was used for live work.

Explicit CLI overrides selected real production SSO/dashboard/device APIs and
disabled both `SENTRY_DSN` and `FLASK_SENTRY_DSN`. `FLASK_DEBUG=0` disabled debug
logging. ENVIRONMENT remained the documented local `devel` setting. Runtime
objects, not assumptions from the frontend origin, confirmed:

```
SSO                     https://login.ubuntu.com
Dashboard account       https://dashboard.snapcraft.io/dev/api/account
Login token exchange    https://api.charmhub.io/v1/tokens/dashboard/exchange
Admin token exchange    https://api.charmhub.io/v1/tokens/dashboard/exchange
```

Live local window: 18:12:32–18:20:58 UTC. Separate SSO authentication succeeded;
Ubuntu One displayed the relying-party destination `http://127.0.0.1:8004/`.
Local SSO authorization was granted under the operator's authorization to run
the account flow. The browser returned to the local app:

```
POST https://login.ubuntu.com/[SSO path] 200 (callback form)
POST http://127.0.0.1:8004/login?[redacted] 302
GET  http://127.0.0.1:8004/account/agreement 200
GET  http://127.0.0.1:8004/admin/account 404 (18:13:28 and 18:20:56 UTC)
```

Sanitized local upstream evidence at 18:13:15, 18:13:28 and 18:20:56 UTC:

```
POST https://api.charmhub.io/v1/tokens/dashboard/exchange
404
account-not-found: The account specified in the dashboard macaroons was not found
```

This is the fresh unsigned-account comparison, NOT exchange expiry. Basic SSO
and the local callback are live-verified; recovery from expired credentials is
not. The intended `/admin/account` page did not load for this unsigned account.
Its post-agreement success is covered only by synthetic tests, because accepting
the real agreement would consume the reproduction state the operator requested
we preserve. Redis was unavailable locally; the app used its in-memory fallback.

## Offline regression comparison (not live)

Existing tests use real Flask routes/templates and the Store API response parser,
but synthetic HTTP responses and an OpenID transport stub; socket operations
are forbidden in the onboarding regression test. Mock agreement acceptance does
not affect any real account.

At 18:14:13–18:14:14 UTC, 16 targeted tests passed: the eight existing
`tests.admin.test_account_onboarding_reproduction` tests and eight
`tests.tests_authentication` tests. The passing suite covers:

- New account and explicit unsigned-agreement redirects.
- Exact expiry before/after mocked agreement acceptance: 302 to fresh login,
  clearing stale auth while retaining the GitHub integration key.
- The real login handler requests a new root and calls the stubbed SSO transport,
  rather than bouncing directly back as authenticated.
- Mocked callback redirects to `/admin/account`, whose HTML returns 200.
- Other unauthorized messages, status 403 with the same message, and another
  error code are NOT swallowed: the existing 502 behavior and auth state remain.
- Existing macaroon authentication errors still require login.

At 18:16:36–18:16:37 UTC, the same eight onboarding tests were rerun with the
original HEAD handler loaded only in that isolated test process. Six passed;
the two exact-expiry cases failed with `502 != 302`. The working file and running
app were not reverted or edited for this comparison. This demonstrates that the
local handler change addresses the synthetic failure, not that production is
running HEAD or that the issue reporter experienced this error.

A failed first test invocation was caused by dotrun consuming Python's `-m`
argument. The successful invocation used `dotrun exec python3 -c` with unittest's
loader. Initial baseline attempts also encountered a dotrun container-name
collision and container Git ownership rejection; no ownership/trust setting was
changed. The successful baseline loaded source obtained outside the container.

## Added opt-in Cypress smoke test

`cypress/e2e/auth-onboarding-live.cy.js` adds:

1. An explicitly opted-in local anonymous redirect check.
2. An interactive, human-assisted production-SSO onboarding scenario for this
   verified but unsigned account. It checks the local callback, agreement page,
   unchecked agreement and current fresh-account 404 behavior. It never creates
   accounts, submits agreements, edits profiles or injects session credentials.
   A fail-closed browser interception blocks local agreement POSTs in case the
   human accidentally submits while paused; it does not mock SSO or expiry.

Both scenarios skip by default. The SSO scenario additionally requires an
interactive Cypress run. The file passed Prettier checking and `node --check`.
**Cypress execution is NOT verified:** the initial runner binary was missing.
Cypress 15.14.2 was downloaded into the local project dependency cache, but the
subsequent run stopped before executing tests because the dotrun image lacks
Xvfb (`spawn Xvfb ENOENT`). No system packages were installed to work around it.
The human-assisted Cypress branch has not been executed. MCP browser observations
above are separate evidence and are not represented as a passing Cypress run.

On a suitably equipped development machine, with app/backend destinations
verified first and no other account's browser state reused:

```sh
# Local, non-authenticated smoke only; no automatic SSO account creation.
dotrun -s exec sh -c 'export CYPRESS_CACHE_FOLDER="$PWD/node_modules/.cache/Cypress"; yarn test-e2e --spec cypress/e2e/auth-onboarding-live.cy.js --config baseUrl=http://127.0.0.1:8004,video=false,screenshotOnRunFailure=false --env LOCAL_AUTH_SMOKE=true'

# Human-assisted live SSO; requires a graphical Cypress environment.
dotrun -s exec sh -c 'export CYPRESS_CACHE_FOLDER="$PWD/node_modules/.cache/Cypress"; yarn cypress open --e2e --config baseUrl=http://127.0.0.1:8004,video=false,screenshotOnRunFailure=false --env LOCAL_AUTH_SMOKE=true,LIVE_SSO_ONBOARDING=true'
```

Do not put credentials in the spec, command line, screenshots or reports.
Do not add production account creation or agreement acceptance to unattended CI.
For an eventual expiry reproduction, record the actual upstream 401 plus exact
code/message before claiming expiry; do not infer it from elapsed time or a
502. Preserve agreement state and report live recovery unverified until seen.

## Changes and retained state

Added only this report and `cypress/e2e/auth-onboarding-live.cy.js` to the checkout.
The pre-existing handler fix, regression tests and unrelated untracked files
were left unchanged. Generated assets were rebuilt. A local Cypress dependency
cache was populated; no global installation or system-package change occurred.
One disposable mailbox/SSO account was created, its email verified by the human,
and local relying-party authorization granted. The Store agreement is unsigned;
no Store account/profile/package mutation was submitted.

Both browser contexts and the local dotrun app were left running on their
agreement pages to preserve the reproduction setup. Generated credentials,
verification links and raw local logs are in a private scratch directory outside
the checkout, `/tmp/snapcraft-5957-rFgSXM/`; the account file is mode 0600. These
are sensitive local artifacts, not report attachments. Disposable-provider
retention and temporary-directory lifetime are limitations; this is not a
permanent managed QA identity. Do not lose the credentials or casually clean up
this scratch directory if future reproduction is required.

No commits, pushes, deployments, GitHub comments, harness-permission changes,
production infrastructure changes, CAPTCHA bypasses or weakened verification.
