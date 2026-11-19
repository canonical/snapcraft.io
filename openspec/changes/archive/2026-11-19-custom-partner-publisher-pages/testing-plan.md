
# Scope

Covered requirements:

1. AC1 \- Snap users can confirm the page is the publisher's official presence (tests 4, 4.a, 4.b, 4.c)  
2. AC2 \- Publishers without a valid custom page get the default page (tests 3.a, 3.b, 3.c)  
3. AC3 \- Page stays complete when optional content is absent (tests 5, 5.a)  
4. AC4 \- No dead ends from unavailable snaps (tests 6, 6.a, 6.b, 6.c)  
5. AC5 \- Custom page content is accessible (tests 13, 13.a for the code review rules; 8 for the decorative icon and banner in the template)  
6. AC6 \- Snap users can reach all of a publisher's snaps from a curated page (tests 6.b, 7, 7.a, 7.b)  
7. AC7 \- Invalid content is caught before merge (tests 9.a, 9.b, 9.d)  
8. DoD1 \- Route handler is generic (tests 1, 1.a, 1.c, 2, 3\)  
9. DoD2 \- Schema is defined and existing content is migrated (tests 10, 10.a)  
10. DoD3 \- Validation and rendering checks run in CI (tests 9, 9.a, 9.b, 9.c, 9.d)  
11. DoD4 \- Content rules are documented for code review (tests 13, 13.a)  
12. DoD5 \- Routing and fallback are covered by tests (tests 1.b, 3, 3.a, 3.b, 3.c, 3.d)  
13. DoD6 \- No visual, accessibility or analytics regression (tests 8.a, 11, 11.a, 12, 12.a)  
14. DoD7 \- Contributor documentation is published (tests 14, 14.a)

Exclusions:

1. Publisher is verified in the Snap Store (DoD4 rule 1\) \- enforced only in code review by design. Covered by the manual review checks in 13.a, no automated test.  
2. Description safety rules (script tags, javascript: links, iframe and embed tags), asset hosting on assets.ubuntu.com, and icon or banner carrying information not available as text (DoD4 rules 2 to 5\) \- automated sanitisation and CI enforcement are out of scope in the ticket. Covered by 13.a only.  
3. Accessibility of content in publisher files (alt text and heading order in the description, featured snap background contrast) \- checked in code review when a page is created. No automated test for future content. The automated accessibility check (8.a) runs only on the three existing pages, as a regression check.  
4. listed\_snaps contains every public snap of the publisher \- this content will not be created, so no "See all snaps" link edge case is tested for it.  
5. Renamed snaps \- snaps cannot be renamed in the Snap Store.  
6. Page behaviour when the Store API is slow or unavailable \- out of scope in the ticket, current behaviour is kept.  
7. Limit or pagination of the snap list when listed\_snaps is not set \- out of scope in the ticket, current behaviour is kept.  
8. Automatic removal of a custom page when a publisher loses verified status \- out of scope in the ticket, handled manually.  
9. New Partner pages, Partner content, Partner approval, traffic baselines and new analytics events \- out of scope in the ticket (Partner onboarding tickets).  
10. Changes to the default publisher page \- out of scope. Only tested for "no change" (3.a).

# Testing strategy

Unit, integrations and component tests will be using Vitest for TypeScript code and unittest for Python code. The route handler, content loading, schema validation and page rendering are Python with Flask and Jinja, so most tests use unittest with the Flask test client. No Vitest tests are planned, because the epic does not change TypeScript code.  
End-to-end tests will use Playwright, with @axe-core/playwright for the accessibility check and Playwright screenshot comparison (toHaveScreenshot) for visual regression. E2E tests run against a local build of the site with stubbed Store API responses, so that before and after comparisons use the same data. E2E viewport widths follow the Vanilla breakpoints ([https\://vanillaframework.io/docs/settings/breakpoint-settings](https://vanillaframework.io/docs/settings/breakpoint-settings)): mobile 375px (below \$breakpoint-small, 620px), tablet 768px (from \$breakpoint-small to below \$breakpoint-large, 1036px), desktop 1280px (from \$breakpoint-large).  
CI validation tests run the validation script (schema check, lowercase file name check) against fixture files and check the exit code and output. Manual checks are used only for review processes, documentation, branch protection and post-release analytics.

Schema rules used by the tests: icon, banner, website, contact, meta description, featured snaps and listed snaps are optional. Every other field in the schema is required. Fields that are not in the schema are rejected.

Snap availability: the handler requests all public snaps by the publisher and keeps only the featured and listed snaps that appear in that list. A snap that is private, unpublished, deleted, never existed or is published by another publisher is not in the list, so all these cases are tested through the same mocked response.

Trust status: the verified or star developer status comes only from the Store API at request time, never from the content file.

Mocks must be created for:

1. Store API publisher details, including the trust status (verified, star developer) and a "publisher does not exist" response  
2. Store API list of public snaps by publisher. It is used to check the availability of featured and listed snaps, and to list all snaps when listed\_snaps is not set  
3. Store API search response for the publisher query, used by the search page that the "See all snaps" link opens (E2E)  
4. A fixture content directory, separate from the production content directory, so that fixture publishers can never go live. It contains valid, minimal (required fields only) and invalid publisher files, plus non-content files (README.md)  
5. The application logger (unittest assertLogs) to check startup errors  
6. Google Analytics / Google Tag Manager network requests in E2E tests (intercepted, never sent to GA)  
7. Pre-refactor baselines captured from main with the same stubbed Store data: HTML snapshots of the three custom pages and of the default publisher page, and screenshots at each viewport width

# Test cases

**IMPORTANT instructions for agent: how to read the table**  
These are the test cases that will be required for the TDD verification loop.  
Variants listed in the same row share that row’s preconditions, action, and expected result. Every row must satisfy its expected result for every listed variant.  
For test case variants that require specific preconditions or produce specific results, we create a separate row with a sub-ID related to the parent test case. In a sub-row, blank Behavior, Test type, Preconditions, Action, or Result cells inherit the corresponding parent value; populated cells replace the parent values. Variants are not inherited: an empty Variants cell means execute that row once.

| ID | Behavior | Test type | Preconditions | Action | Result | Variants |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | List of custom publishers is loaded at startup from content file names | Unit | Content directory contains valid jetbrains.yaml, kde.yaml and snapcrafters.yaml | Loading publisher content at application startup | The custom publisher registry contains exactly jetbrains, kde and snapcrafters, keyed by file name without extension. No hardcoded publisher list exists in the route handler | Production content directory, fixture content directory |
| 1.a | A new publisher is enabled by adding one content file |  | Fixture content directory contains the three existing files plus a valid newpartner.yaml. No application code is changed |  | The registry contains newpartner in addition to the three existing publishers |  |
| 1.b | An invalid content file is skipped at startup and an error is logged |  | Fixture content directory contains the three valid files plus one invalid file |  | The invalid file is not in the registry. One error is logged that identifies the file name. The three valid files are loaded. The application starts without an exception | Missing required field, field not in the schema, more than two featured snaps, invalid hex colour, malformed YAML, empty file |
| 1.c | Non-content files in the content directory are not loaded as publishers |  | Content directory also contains README.md |  | Non-content files are not in the registry and no error is logged |  |
|  |  |  |  |  |  |  |
| 2 | Parsed content is not changed at request time | Unit | Registry is loaded from the fixture directory and a deep copy of the parsed content is stored | Requesting each custom page three times | The registry content is deep-equal to the stored copy after all requests | jetbrains, kde, snapcrafters |
|  |  |  |  |  |  |  |
| 3 | Publisher with a valid content file gets the custom page | Integration | Store API is mocked to return the publisher and its public snaps. The publisher has a valid content file | GET /publisher/\<username\> | Response is 200 and the custom page template is rendered with the content from the file, at the same URL as before the refactor | jetbrains, kde, snapcrafters, newpartner (fixture) |
| 3.a | Publisher without a content file gets the default page |  | Publisher exists in the mocked Store and has no content file |  | Response is 200 and the default publisher page is rendered. The body matches the pre-refactor default page snapshot for the same mocked data |  |
| 3.b | Publisher with an invalid content file gets the default page |  | Publisher exists in the mocked Store. Its content file is invalid and was skipped at startup |  | Response is 200 and the default publisher page is rendered, not an error page | Missing required field, field not in the schema, more than two featured snaps, invalid hex colour, malformed YAML, empty file |
| 3.c | Empty public snap list without a content file preserves the default page |  | No content file exists. Mocked Store returns HTTP 200 with an empty public snap list for the requested username |  | Response is 200 and the default publisher page is rendered with no snap cards, using the requested username as the fallback publisher identity |  |
| 3.d | Empty public snap list with a valid content file preserves the custom page |  | Fixture content directory has a valid file for the requested username. Mocked Store returns HTTP 200 with an empty public snap list for that username |  | Response is 200 and the custom publisher page is rendered with the content from the file and no snap cards. Unavailable featured and listed snaps follow the rules in tests 6.a and 6.b where those sections are configured |  |
|  |  |  |  |  |  |  |
| 4 | Publisher identity and trust status are shown before any install action | Integration | Mocked Store returns the publisher as verified. Publisher has a valid content file | GET the custom page and parse the HTML | The publisher display name and the verified status are rendered in the page header, before the first snap card or install link in document order | jetbrains, kde, newpartner (fixture) |
| 4.a | Snapcrafters shows its star developer status |  | Mocked Store returns snapcrafters as a star developer |  | The display name and the star developer status are rendered in the page header, before the first snap card or install link |  |
| 4.b | Trust status is available to screen reader and keyboard users | E2E | Custom page is loaded in the browser | Reading the accessibility tree, then moving through the page with the Tab key only | The trust status has an accessible name that states the status in text (for example "Verified account"), not only an icon. Any tooltip or explanation of the status can be opened and read with keyboard focus | jetbrains, kde, snapcrafters |
| 4.c | Trust status comes from the Store, not from the content file | Integration | Publisher has a valid content file. Mocked Store returns the publisher with no verified or star developer status | GET the custom page and parse the HTML | The custom page renders, and no verified or star developer status is shown |  |
|  |  |  |  |  |  |  |
| 5 | Page stays complete when optional fields are omitted | Integration | Content file contains all required fields and omits the listed optional field(s). Mocked Store returns the publisher and its public snaps | GET the custom page and parse the HTML | Response is 200\. No empty section or heading for the omitted field, no placeholder text, no img element with an empty or missing src, no link with an empty, missing or "\#" href | Omit icon, omit banner, omit website, omit contact, omit featured snaps, omit listed snaps, omit all optional fields together |
| 5.a | Page uses the fallback meta description when it is omitted from the file |  | Content file omits meta description |  | The page has the same fallback meta description as the current template, and no meta description tag with empty content |  |
|  |  |  |  |  |  |  |
| 6 | Featured and listed snaps that are not in the publisher's public snaps are left out | Integration | Content file has two featured snaps and three listed snaps. The mocked list of the publisher's public snaps does not contain one featured and one listed snap | GET the custom page and parse the HTML | The missing snaps have no card and no link to their URL. The other snaps are rendered in the order of the content file | Snap name that does not exist in the Store, snap that is public but published by another publisher |
| 6.a | Featured section is left out when no featured snaps are available |  | The mocked list of public snaps contains neither featured snap |  | The featured section, including its heading, is not on the page. The rest of the page renders normally |  |
| 6.b | Listed snaps section shows a note when no listed snaps are available |  | The mocked list of public snaps contains none of the listed snaps |  | The listed snaps section and its heading are on the page with a note that says the publisher's snaps are not available right now. No snap cards are rendered. The "See all snaps published by \<publisher\>" link is on the page |  |
| 6.c | A snap in both featured and listed snaps is shown only as featured |  | Content file has the same snap in featured snaps and listed snaps. The snap is in the mocked list of public snaps |  | The snap is rendered once, in the featured section, and is not in the listed snaps section |  |
|  |  |  |  |  |  |  |
| 7 | Curated page links to all of the publisher's snaps on the search page | Integration | Content file sets listed\_snaps and all listed snaps are in the mocked list of public snaps | GET the custom page and parse the HTML | A "See all snaps published by \<publisher display name\>" link is rendered after the listed snaps. Its href points to the search page with a query that returns the publisher's snaps |  |
| 7.a | No "See all snaps" link when listed\_snaps is not set |  | Content file does not set listed\_snaps. Mocked Store returns the publisher's public snaps |  | The listed section shows every public snap returned by the Store, except featured snaps. No "See all snaps" link is rendered |  |
| 7.b | "See all snaps" link leads to every public snap by the publisher | E2E | Custom page with listed\_snaps set is loaded. Stubbed Store data has public snaps that are not in listed\_snaps | Clicking the "See all snaps published by \<publisher\>" link | The search page loads without error and shows every public snap by the publisher, including the snaps not in listed\_snaps |  |
|  |  |  |  |  |  |  |
| 8 | Decorative icon and banner are ignored by screen readers | Integration | Content file has an icon and a banner | GET the custom page and parse the HTML | The image has alt="" (or is otherwise hidden from the accessibility tree) | Icon, banner |
| 8.a | Existing custom pages have no WCAG 2.1 AA violations | E2E | Custom page is loaded | Running axe-core with the wcag2a, wcag2aa, wcag21a and wcag21aa tags | No violations are reported. Violations that already exist before the refactor are fixed in this epic | jetbrains, kde, snapcrafters at desktop and mobile widths |
|  |  |  |  |  |  |  |
| 9 | Valid publisher files pass CI validation | Unit | Production content directory with the migrated files | Running the CI validation script | Exit code is 0 and no errors are reported |  |
| 9.a | Invalid publisher files fail CI validation and identify the file and field |  | Fixture directory with one invalid file |  | Exit code is not 0\. The output names the file path and the field at fault | Missing each required field (one per run), field not in the schema, three featured snaps, invalid hex colour ("\#12345", "red", "\#GGGGGG"), wrong value type (for example listed\_snaps as a string), malformed YAML |
| 9.b | File names with uppercase letters fail CI validation |  | Fixture directory with a valid file whose name has uppercase letters |  | Exit code is not 0\. The output names the file and says that file names must be lowercase | JetBrains.yaml, KDE.yaml, newPartner.yaml |
| 9.c | Every custom page renders without errors | Integration | Store API mocked. Test is parametrised over the files in the production content directory, so new files are included automatically | Rendering the custom page for each file | No exception is raised and the response is 200 | Every file in the production content directory |
| 9.d | A failing check blocks the merge | Manual | Draft pull request on the snapcraft.io repository | Pushing a commit that adds a file that fails one check | The CI job fails, the log identifies the file (and the field, for schema errors), and branch protection blocks the merge | Schema error, uppercase file name, file that passes the schema but fails to render |
|  |  |  |  |  |  |  |
| 10 | Validator class checks structure of content YAML files | Unit | Validator class is defined in application code | Running validator unit tests against expected valid and invalid data structures | The validator runs without errors on valid data structures and fails on invalid ones. Only icon, banner, website, contact, meta description, featured snaps and listed snaps are optional, and unexpected fields are rejected |  |
| 10.a | Existing content is validated by the validator class |  | List of listed snaps from the pre-migration snapcrafters-snaps.yaml is stored as a fixture | Listing the content directory and validating the three files using the validator class | snapcrafters-snaps.yaml does not exist. jetbrains.yaml, kde.yaml and snapcrafters.yaml are valid. The listed snaps in snapcrafters.yaml are the same as in the fixture |  |
|  |  |  |  |  |  |  |
| 11 | Existing custom pages show the same content after release | Integration | Pre-refactor HTML snapshots captured from main with the same mocked Store data | Rendering each page after the refactor and extracting publisher details, featured snaps, listed snaps and link hrefs | The extracted data is equal to the data extracted from the pre-refactor snapshot | jetbrains, kde, snapcrafters |
| 11.a | Existing custom pages look the same after release | E2E | Pre-refactor baseline screenshots captured from main with the same stubbed Store data | Taking full-page screenshots at each viewport width | No pixel differences with the default Playwright comparison settings. Each difference is reviewed and accepted as intended or fixed | jetbrains, kde, snapcrafters at desktop (1280px), tablet (768px) and mobile (375px) |
|  |  |  |  |  |  |  |
| 12 | Page views are recorded under the same page paths | E2E | GA and GTM requests are intercepted | Loading each custom page | One page view is recorded with the page path /publisher/\<username\>, the same as before the refactor | jetbrains, kde, snapcrafters |
| 12.a | Page view data continues after release | Manual | Release is deployed to production | Checking GA reports for the three page paths for one week before and after the release date | Page views continue under the same page paths, with no gap and no new page path for these pages |  |
|  |  |  |  |  |  |  |
| 13 | Code review rules are documented | Manual | Code review instructions are merged | Reading the README in the publisher content directory, CONTRIBUTING.md and .github/copilot-instructions.md | The README lists all rejection rules from DoD4, including the accessibility rules from AC5. CONTRIBUTING.md and .github/copilot-instructions.md both mention the rules and point to the README |  |
| 13.a | Copilot code review applies the rules |  | One draft pull request per rule, each with a publisher file that breaks only that rule | Requesting a review from Copilot | Copilot flags the file and names the rule that it breaks | Unverified publisher, script tag, javascript: link, iframe, embed, asset not on assets.ubuntu.com, information only in icon or banner, description image without alt text, featured background with low contrast, description headings out of order, same snap in featured snaps and listed snaps |
|  |  |  |  |  |  |  |
| 14 | Contributor documentation is complete | Manual | README is in the publisher content directory | Reading the README and the CONTRIBUTING guide | README explains file naming, every field in the schema, allowed HTML in the description, content and asset rules, and how to read CI validation errors. CONTRIBUTING links to the README and the link works |  |
| 14.a | A team member can add a page using only the documentation |  | A team member who did not work on the epic, and a fixture publisher | Following only the README to add the fixture publisher page locally, then fixing a deliberately invalid field using only the CI error output | The page renders locally and CI passes, with no help from the implementers |  |
