# Authenticated publisher basic operations

## Application Overview

Source-based test plan for the authenticated Snap Store publisher dashboard. Live exploration and execution are BLOCKED: planner_setup_page failed because @playwright/test cannot be resolved from seed.spec.ts, and browser tools require successful setup. No scenario below has been browser-verified, and the file paths identify proposed Cypress specs, not generated executable tests. The repository already uses Cypress (dotrun exec yarn test-e2e); cypress/e2e/publisher.cy.js currently contains only a login TODO. Do not introduce a second runner solely for these tests. Prerequisites: use an isolated staging/local environment with built assets (dotrun exec yarn build) and a running responsive app at http://127.0.0.1:8004; supply a dedicated test publisher with legitimate authenticated session setup, never checked-in cookies or credentials. Start each scenario with a fresh browser context and fresh independent test data, establishing authentication anew unless testing logged-out behavior. Provision an owned published snap with valid listing metadata, an owned unreleased registered snap, and a published snap owned by a different test account. Use unique names for registrations; destructive confirmation must use disposable fixtures only. Mock upstream services or selected API responses for deterministic error cases, but do not describe intercepted UI tests as proof of server-side authentication or persisted writes. Run authentication/authorization cases against real Flask routes with mocked upstream services. Verify successful mutations by reloading and by reading back server state; restore original metadata in finally/afterEach. Do not publish revisions, trigger builds, change production privacy, or unregister real packages. Prefer role/label selectors and request-based waits over arbitrary delays. The known source naming rules for snap registration require up to 40 characters, lowercase letters/digits/hyphens, at least one letter, and no leading/trailing hyphen; tests should enforce that contract rather than copying the current validator. Seed: seed.spec.ts (setup attempted, failed).

## Test Scenarios

### 1. Authentication and publisher navigation

**Seed:** `seed.spec.ts`

#### 1.1. Logged-out users cannot access publisher pages

**File:** `cypress/e2e/publisher-auth.cy.js`

**Steps:**
  1. Start a fresh context with no session. Independently request /snaps, /register-snap, /admin/account, and /<owned-published-snap>/{listing,builds,releases,metrics,publicise,settings} without following redirects automatically.
    - expect: Each protected route redirects toward the login handler; its next parameter preserves the requested path.
    - expect: No publisher HTML containing private account or snap data is returned.
  2. Open /snaps in the browser and inspect the resulting login destination.
    - expect: The browser reaches the legitimate login flow instead of the publisher dashboard.
    - expect: No authentication bypass, fabricated signed session, or production credentials are used.

#### 1.2. Authenticated publisher overview and management navigation

**File:** `cypress/e2e/publisher-auth.cy.js`

**Steps:**
  1. Start a fresh context, establish a legitimate dedicated publisher session, seed an owned published snap and an owned registered snap, and visit /snaps.
    - expect: My snaps / Overview is visible after /snaps.json completes.
    - expect: Published and registered fixtures are displayed in their appropriate sections; unrelated account fixtures are absent.
  2. Open the published snap, then follow Listing, Builds, Releases, Metrics, Publicise, and Settings in the Snap management navigation.
    - expect: Each route uses the selected snap name and displays its corresponding page or intentional empty state.
    - expect: Current navigation state matches the route; account and snap identity remain consistent.
    - expect: No builds or releases are triggered by read-only navigation.
  3. Reload the Settings deep link and return to /snaps through the available navigation.
    - expect: The authenticated deep link loads without a login loop.
    - expect: The overview remains accessible and shows the original fixtures.

#### 1.3. Overview empty, loading, and failed-fetch states

**File:** `cypress/e2e/publisher-auth.cy.js`

**Steps:**
  1. Start a fresh authenticated context with no snaps and visit /snaps using an empty, structurally valid /snaps.json response.
    - expect: The Get started empty state is shown without stale snap rows.
  2. Independently reset the context and delay a valid /snaps.json response before releasing it.
    - expect: Fetching snaps appears while pending and disappears when data arrives.
    - expect: Loaded rows replace the loading state.
  3. Independently reset the context and return HTTP 500 from /snaps.json; then remove the failure and reload.
    - expect: Something went wrong. Please try again later. appears during the failure.
    - expect: A successful reload recovers without stale errors or cross-account data.

#### 1.4. Non-owner and expired-session requests do not change protected data

**File:** `cypress/e2e/publisher-auth.cy.js`

**Steps:**
  1. Start a fresh authenticated context for publisher A and request publisher B's snap listing/settings pages and their /api/<snap>/listing and /api/<snap>/settings data routes against the real Flask authorization boundary.
    - expect: Protected data is not disclosed to the non-owner; the response follows the application's denial contract, not a successful owner response.
    - expect: Do not assert a specific status until the route contract has been verified in execution.
  2. Using valid CSRF setup but the non-owner identity, attempt an isolated metadata change against B's disposable snap and read back its state as B.
    - expect: The mutation is denied and B's metadata remains unchanged.
  3. Reset with A's legitimate session, load an editable page, invalidate the server session, then attempt Save and reload a protected route.
    - expect: The mutation cannot succeed after session expiry and no successful-save assertion is accepted without readback.
    - expect: The protected route requires authentication; no account data leaks into the fresh logged-out state.

### 2. Snap name registration

**Seed:** `seed.spec.ts`

#### 2.1. Registration defaults and cancel are non-mutating

**File:** `cypress/e2e/publisher-registration.cy.js`

**Steps:**
  1. Start a fresh authenticated context, record the account's registered names, and open /register-snap.
    - expect: Register snap, Store, Snap name, and Snap privacy controls are present.
    - expect: For the ubuntu store, Private is selected and privacy controls are disabled.
    - expect: Register is disabled while the name is empty; the manual review information is displayed.
  2. Toggle Show snap name constraints, then Hide snap name constraints. Enter a unique valid name and select Cancel.
    - expect: Constraints are shown and hidden on demand.
    - expect: Cancel returns to /snaps without a POST to /api/register-snap.
    - expect: Readback confirms no name was registered.

#### 2.2. Snap name validation rejects invalid characters and enforces length boundaries

**File:** `cypress/e2e/publisher-registration.cy.js`

**Steps:**
  1. Start a fresh authenticated context at /register-snap. Independently enter empty input, uppercase letters, spaces, underscores, punctuation, numeric-only names, a leading hyphen, and a trailing hyphen; reset the field between inputs.
    - expect: Each invalid value prevents a registration request.
    - expect: The form remains usable for correction; failures are reported if the implementation permits invalid submission.
  2. Independently enter valid names of 1, 39, and 40 characters, each containing a lowercase letter, then a 41-character name. Do not actually submit these boundary names.
    - expect: Valid names of up to and including 40 characters enable registration.
    - expect: The 41-character name prevents registration.
    - expect: A valid correction re-enables registration without reloading.

#### 2.3. Register a unique disposable name and verify persistence

**File:** `cypress/e2e/publisher-registration.cy.js`

**Steps:**
  1. Start a fresh authenticated context with a dedicated test publisher. Generate a unique valid name under 40 characters, open /register-snap, select the intended test store, enter the name, and submit once.
    - expect: One POST to /api/register-snap carries the intended snap_name and store and valid CSRF data.
    - expect: The in-progress Registering state prevents duplicate submissions.
  2. Wait for successful registration and navigation to /snaps, then reload the overview and read back the account's registered names.
    - expect: The new name appears exactly once in Registered snap names after reload.
    - expect: Registration does not upload, publish, or make the snap public.
  3. Clean up only this disposable registration through an authorized test fixture cleanup, including any required step-up authorization.
    - expect: Cleanup leaves no names created by the scenario; cleanup errors are reported rather than silently ignored.

#### 2.4. Duplicate registration shows a dispute link and allows correction

**File:** `cypress/e2e/publisher-registration.cy.js`

**Steps:**
  1. Start a fresh authenticated context and provision a name already registered by another test publisher. Submit that name, or intercept only the registration response with a contract-valid already_registered response for a deterministic UI case.
    - expect: The page says the name is already taken and offers file a dispute.
    - expect: The browser does not navigate to /snaps as if registration succeeded.
    - expect: The dispute link preserves the attempted snap-name and store in its query parameters.
  2. Enter a different unique valid name without submitting and then select Cancel.
    - expect: Registration controls recover from the failed submission.
    - expect: The original registered name remains owned by its original publisher and no extra name is created.

### 3. Listing edits and persistence

**Seed:** `seed.spec.ts`

#### 3.1. Save a summary change and read back persisted state

**File:** `cypress/e2e/publisher-listing.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an owned published disposable snap. Snapshot its original listing, open /<snap>/listing, and change Summary to a unique short valid value without changing other fields.
    - expect: The original listing loads and Save becomes available when the field is changed.
    - expect: No mutation occurs merely from typing.
  2. Select Save once and await POST /api/<snap>/listing and any subsequent listing refetch. If metadata warning confirmation is presented by this fixture, follow it explicitly before asserting completion.
    - expect: A single intended mutation sends the summary change and valid CSRF data.
    - expect: Changes applied successfully. appears only for a successful response.
  3. Reload the page and read the listing from the backend, then restore the original summary in teardown.
    - expect: The updated summary persists after reload and unrelated listing fields are unchanged.
    - expect: Teardown restores and verifies the original listing even if an assertion fails.

#### 3.2. Revert unsaved listing changes and validate required fields

**File:** `cypress/e2e/publisher-listing.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an owned published snap and valid baseline listing. Change Summary and Description, then select Revert.
    - expect: Both fields return to their originally loaded values.
    - expect: No POST /api/<snap>/listing is made; reload shows unchanged server state.
  2. Independently clear each required field, including Summary and Description, and try to save using keyboard as well as button activation where enabled.
    - expect: Required-field validation identifies the invalid field and prevents saving invalid metadata.
    - expect: An accessible label associates each tested field with its input.
  3. Restore valid values without saving and use Revert or reload.
    - expect: Validation recovers without leaving the form stuck.
    - expect: The server listing is unchanged.

#### 3.3. Backend validation errors do not masquerade as saved listing changes

**File:** `cypress/e2e/publisher-listing.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an owned published snap. Change Summary and intercept the save response with a contract-valid JSON errors array containing a distinctive validation message; do not mutate the real backend.
    - expect: The server validation message is displayed as an error.
    - expect: Changes applied successfully. is not shown.
  2. Remove the interception, reload, and compare the listing with its original baseline.
    - expect: The failed value has not persisted.
    - expect: The editor can be used again; server readback, not dirty-state indicators alone, determines whether the save succeeded.

#### 3.4. Unreleased snap cannot save listing or settings changes

**File:** `cypress/e2e/publisher-listing.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an owned registered snap with no published revisions. Open its listing and settings routes independently.
    - expect: An intentional unreleased-snap warning or unavailable editing state is shown, rather than a misleading successful editor.
    - expect: Navigation controls follow the unreleased snap policy.
  2. Against real Flask routes with valid authentication and CSRF, independently submit a harmless metadata mutation to /api/<unreleased-snap>/listing and /api/<unreleased-snap>/settings, with upstream release history seeded empty.
    - expect: Each mutation is rejected with HTTP 403, success false, and a no-releases error instructing publication of a first revision.
    - expect: No downstream metadata update occurs and baseline state is unchanged.

### 4. Safe unregister and publicise controls

**Seed:** `seed.spec.ts`

#### 4.1. Unregister confirmation can be cancelled without deleting a name

**File:** `cypress/e2e/publisher-unregister.cy.js`

**Steps:**
  1. Start a fresh authenticated context with a disposable owned registered snap. From /snaps, locate its specific Registered snap names row and select Unregister.
    - expect: A modal names the intended snap and warns that releasing the name is permanent.
    - expect: No DELETE /packages/<snap> is sent on opening the modal.
  2. Select Cancel, reopen the modal, and dismiss it with Escape if supported by the dialog contract.
    - expect: The modal closes and focus returns to a usable trigger.
    - expect: No deletion is sent by either cancellation path; reload and backend readback confirm the name remains registered.

#### 4.2. Confirmed disposable unregister handles step-up authorization and persistence

**File:** `cypress/e2e/publisher-unregister.cy.js`

**Steps:**
  1. Start a fresh authenticated context and independently provision an owned disposable registered snap. Open its row's unregister modal and confirm exactly once.
    - expect: DELETE /packages/<snap> includes valid CSRF data and cannot be duplicated while in progress.
    - expect: If the backend returns 202 with authorization_required and redirect_url, follow the legitimate test account step-up flow; a 202 alone is not considered completed deletion.
  2. Complete any required authorization, wait for the overview, reload it, and query the registered names as the same publisher.
    - expect: The disposable name is absent from both UI and backend readback.
    - expect: A success notification is shown for successful completion, not for cancelled or expired authorization.
    - expect: No name outside the fixture is removed.

#### 4.3. Unregister service rejection preserves the registration

**File:** `cypress/e2e/publisher-unregister.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an independently provisioned registered snap. Intercept only DELETE /packages/<snap> with an HTTP 403 JSON error containing a distinctive rejection message, then confirm unregister.
    - expect: The rejection is presented to the user and no success notification is shown.
    - expect: The modal leaves the user able to recover or retry.
  2. Remove the interception, reload the overview, and read the registration from the backend.
    - expect: The name remains registered and displayed.
    - expect: No failed operation is reported as successful persistence.

#### 4.4. Publicise badge controls update preview and generated snippets without saving

**File:** `cypress/e2e/publisher-publicise.cy.js`

**Steps:**
  1. Start a fresh authenticated context with an owned public published snap that is not trending. Open /<snap>/publicise and follow GitHub badges.
    - expect: The route becomes /<snap>/publicise/badges.
    - expect: Stable channel from default track is selected initially; HTML and Markdown snippets refer to the current snap.
  2. Deselect the stable badge with Trending status also deselected, then select Trending status.
    - expect: With neither selected, Please select at least one badge to display from the list above appears and the preview/snippets are hidden.
    - expect: Selecting Trending status displays its preview and snippets plus the not-currently-trending information.
  3. Select the stable badge again and navigate to Embeddable cards, then reload the badge route.
    - expect: Both selected snippets correspond to the same snap before navigation.
    - expect: Read-only interactions send no metadata, registration, release, or build mutation.
    - expect: Reload restores the badge page's initial local defaults.
