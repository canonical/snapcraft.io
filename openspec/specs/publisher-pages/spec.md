# publisher-pages Specification

## Purpose
Generalize custom publisher pages for selected Partners while preserving existing public URLs, default-page behavior, curated snap access, and protection against status-based publisher account enumeration.

## Requirements

### Requirement: Content-driven publisher page selection
At `/publisher/<username>`, admitted custom content SHALL select the custom page; otherwise the existing default page SHALL render. Selection SHALL preserve the URL without a hardcoded publisher list, subject to the explicit `snap-quarantine` exception.

Source: `human-spec.md` — Specification / overview items 1 and 3, Security / Publisher account enumeration; `testing-plan.md` — tests 3, 3.a and 3.b.

#### Scenario: Valid content selects the custom page
- **WHEN** `jetbrains`, `kde`, `snapcrafters`, or fixture publisher `newpartner` has valid content and its page is requested with mocked public snap data
- **THEN** the response is HTTP 200 and renders the custom template using that content at `/publisher/<username>`

Source: `testing-plan.md` — test 3, all variants; `human-spec.md` — Specification / overview items 1 and 3.

#### Scenario: Missing content preserves the default page
- **WHEN** a publisher has no custom content file and its page is requested
- **THEN** the response is HTTP 200 and renders the default template with the same body as the pre-refactor default page for the same mocked Store data

Source: `testing-plan.md` — test 3.a and Scope / exclusion 10; `human-spec.md` — Specification / overview item 1.

#### Scenario: Rejected content falls back to the default page
- **WHEN** a publisher's content was excluded at startup for a missing required field, unknown field, more than two featured snaps, invalid hex colour, malformed YAML, or an empty file
- **AND** its page is requested with the Store mocked as in test 3.b
- **THEN** the response is HTTP 200 and renders the default publisher page, not an error page

Source: `human-spec.md` — Formal YAML Schema / startup validation paragraph; `testing-plan.md` — test 3.b, all variants.

### Requirement: Publisher account enumeration protection
Publisher pages MUST NOT expose account nonexistence through HTTP status. For a valid publisher URL, successful empty Store results MUST produce HTTP 200 and the applicable page without snap cards, preventing status-based account enumeration. `snap-quarantine` MUST remain the explicit 404 exception.

Source: `human-spec.md` — Security / Publisher account enumeration; `testing-plan.md` — tests 3.c and 3.d.

#### Scenario: Empty results without custom content
- **WHEN** no custom content exists for a syntactically valid username and the Store returns HTTP 200 with an empty public snap list
- **THEN** the page returns HTTP 200 with the default template, no snap cards, and the requested username as fallback publisher identity
- **AND** the empty response is not treated as proof that an account does not exist

Source: `human-spec.md` — Security / Publisher account enumeration; `testing-plan.md` — test 3.c.

#### Scenario: Empty results with custom content
- **WHEN** valid custom content exists and the Store returns HTTP 200 with an empty public snap list
- **THEN** the page returns HTTP 200 with the custom content and no snap cards
- **AND** configured unavailable featured and listed sections follow the omitted-featured-section and unavailable-listed-section rules below

Source: `human-spec.md` — Security / Publisher account enumeration; `testing-plan.md` — tests 3.d, 6.a and 6.b.

#### Scenario: Quarantined publisher remains an exception
- **WHEN** `/publisher/snap-quarantine` is requested
- **THEN** the page returns HTTP 404 rather than the default or custom publisher page

Source: `human-spec.md` — Security / Publisher account enumeration / explicit exception.

### Requirement: Store-sourced publisher trust status
Custom headers SHALL show the configured name and API-only request-time trust status before install actions. No status SHALL mean no badge, not a disabled page. Status names and explanations SHALL support screen-reader and keyboard access.

Source: `human-spec.md` — Differences with current schema / item 4; `testing-plan.md` — Testing strategy / Trust status, tests 4, 4.a, 4.b and 4.c, Scope / exclusions 1 and 8.

#### Scenario: Verified identity precedes install actions
- **WHEN** the Store supplies verified status for `jetbrains`, `kde`, or fixture publisher `newpartner`
- **THEN** the custom page header contains its display name and verified status before the first snap card or install link in document order

Source: `testing-plan.md` — test 4, all variants; `human-spec.md` — Differences with current schema / item 4.

#### Scenario: Snapcrafters displays Store-provided star status
- **WHEN** the Store supplies star-developer status for `snapcrafters`
- **THEN** its header displays the name and star-developer status before the first snap card or install link

Source: `testing-plan.md` — test 4.a; `human-spec.md` — Rationale / Snapcrafters exception and Differences with current schema / item 4.

#### Scenario: No Store trust status means no badge
- **WHEN** valid custom content exists but the Store supplies neither verified nor star-developer status
- **THEN** the custom page still renders and neither trust badge is shown

Source: `testing-plan.md` — test 4.c and Scope / exclusion 8; `human-spec.md` — Differences with current schema / item 4.

#### Scenario: Trust status supports assistive technology
- **WHEN** a user reads the accessibility tree and navigates `jetbrains`, `kde`, or `snapcrafters` using only the Tab key
- **THEN** the status has an accessible textual name stating the status
- **AND** any status tooltip or explanation can be opened and read through keyboard focus

Source: `testing-plan.md` — test 4.b, all variants.

### Requirement: Complete pages with optional content omitted
Omitted optional content SHALL leave a complete HTTP 200 page without empty sections, orphan headings, placeholders, empty or missing image sources, or empty, missing, or `#` link destinations. Missing meta descriptions SHALL use the existing fallback. Missing icons may use the default icon or no icon.

Source: `human-spec.md` — Sample custom publisher page file and Formal YAML Schema; `testing-plan.md` — tests 5 and 5.a.

#### Scenario: Optional content omissions do not break rendering
- **WHEN** otherwise valid content omits the icon, banner, website, contact, featured snaps, or listed snaps individually, or omits all optional fields together
- **THEN** the page returns HTTP 200 without empty markup or invalid image/link destinations caused by the omission
- **AND** omitting `listed_snaps` selects the all-public-snaps layout rather than removing available nonfeatured snaps

Source: `testing-plan.md` — test 5, all variants, and test 7.a; `human-spec.md` — Differences with current schema / item 5.

#### Scenario: Meta description falls back to the existing text
- **WHEN** `meta_description` is omitted
- **THEN** the page uses the existing fallback, `Install <display_name> software for Linux in the Snap Store`, and does not render an empty meta description

Source: `testing-plan.md` — test 5.a; `human-spec.md` — Sample custom publisher page file / meta_description. The literal fallback is the baseline in `templates/store/publisher-details.html`.

### Requirement: Showcase only the publisher's available public snaps
Custom pages SHALL render configured featured and listed snaps only when they appear in the Store's public snap list for that publisher. Available curated snaps SHALL retain content-file order. A snap present in both configured sections SHALL appear only as featured. Missing snaps SHALL have neither cards nor links to their snap URLs.

Source: `human-spec.md` — Differences with current schema / item 5; `testing-plan.md` — Testing strategy / Snap availability, tests 6 and 6.c.

#### Scenario: Unavailable or other-publisher snaps are omitted
- **WHEN** content configures two featured and three listed snaps, but the mocked publisher's public list lacks one featured and one listed snap
- **THEN** the unavailable entries have no card or link, and the remaining curated snaps preserve their content-file order
- **AND** this holds both for a nonexistent snap name and a public snap owned by another publisher

Source: `testing-plan.md` — test 6, both variants, and Testing strategy / Snap availability.

#### Scenario: Duplicate showcase entry is featured only
- **WHEN** an available public snap is configured in both `featured_snaps` and `listed_snaps`
- **THEN** it is rendered once in the featured section and not in the listed section

Source: `testing-plan.md` — test 6.c.

### Requirement: Showcase empty states and access to the full catalogue
Nonempty `listed_snaps` SHALL select curated results and publisher search; an unavailable selection SHALL retain its heading, note, and link. Without a nonempty list, all returned nonfeatured public snaps SHALL render without that link. No available featured snaps SHALL mean no featured section.

Source: `human-spec.md` — Differences with current schema / item 5; `testing-plan.md` — tests 6.a, 6.b, 7, 7.a and 7.b.

#### Scenario: No featured snaps are available
- **WHEN** neither configured featured snap appears in the publisher's public snap list
- **THEN** the featured section and any heading for it are absent, while the rest of the page renders normally

Source: `testing-plan.md` — test 6.a.

#### Scenario: No configured listed snaps are available
- **WHEN** the configured `listed_snaps` list is nonempty but none of its snaps appears in the publisher's public snap list
- **THEN** the listed section and heading remain, with a note stating that the publisher's snaps are not available right now
- **AND** the listed section has no snap cards and retains the `See all snaps published by <publisher display name>` link

Source: `testing-plan.md` — tests 6.b and 3.d; `human-spec.md` — Differences with current schema / item 5.

#### Scenario: Curated page offers publisher search
- **WHEN** a nonempty configured list is available and the page renders
- **THEN** the `See all snaps published by <publisher display name>` link follows the listed snaps and targets the search page with a publisher query
- **AND** following it loads the search page without errors and shows all public snaps in the stubbed publisher catalogue, including snaps not in the curated list

Source: `testing-plan.md` — tests 7 and 7.b; `human-spec.md` — Differences with current schema / item 5.

#### Scenario: No curated selection shows nonfeatured public snaps
- **WHEN** `listed_snaps` is omitted or empty
- **THEN** the page displays all returned public snaps except featured snaps
- **AND** no `See all snaps` link is rendered

Source: `human-spec.md` — Differences with current schema / item 5; `testing-plan.md` — test 7.a covers the omitted-list case.

### Requirement: Decorative publisher imagery
The publisher icon and banner SHALL be decorative to assistive technology rather than duplicating the publisher identity or carrying information unavailable as text.

Source: `testing-plan.md` — test 8, Scope / AC5 and exclusion 2; `human-spec.md` — Sample custom publisher page file / icon and banner.

#### Scenario: Decorative imagery is excluded from screen-reader content
- **WHEN** a custom page has a publisher icon or banner
- **THEN** each image has an empty `alt` attribute or is otherwise excluded from the accessibility tree

Source: `testing-plan.md` — test 8, icon and banner variants.

### Requirement: Preserve existing publisher content and page paths
For identical Store data, `jetbrains`, `kde`, and `snapcrafters` SHALL retain publisher details, featured/listed snap content, and link destinations. Each SHALL retain `/publisher/<username>` and one page-view event under that path per load, without new analytics events.

Source: `human-spec.md` — Specification / opening preservation paragraph; `testing-plan.md` — tests 11, 11.a, 12 and 12.a, Scope / exclusion 9.

#### Scenario: Existing content survives migration
- **WHEN** each existing custom page is rendered after migration using the same mocked Store data as its pre-refactor `main` baseline
- **THEN** extracted publisher details, featured snaps, listed snaps, and link hrefs equal those extracted from that baseline

Source: `testing-plan.md` — test 11, all three publisher variants; `human-spec.md` — Specification / preservation paragraph and overview item 2.

#### Scenario: Page-view paths remain unchanged
- **WHEN** each of the three custom pages is loaded with GA and GTM requests intercepted
- **THEN** exactly one page view is recorded for its existing `/publisher/<username>` path
- **AND** the test does not send analytics requests to GA

Source: `testing-plan.md` — test 12, all three publisher variants, and Mocks item 6.
