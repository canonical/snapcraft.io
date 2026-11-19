

| Index | WD508 |  |  |
| :---- | :---- | :---- | :---- |
| Title | Custom Partner publisher pages |  |  |
| [**Type**](https://docs.google.com/document/d/1lStJjBGW7lyojgBhxGLUNnliUocYWjAZ1VEbbVduX54/edit?usp=sharing) | **Author(s)** | [**Status**](https://docs.google.com/document/d/1lStJjBGW7lyojgBhxGLUNnliUocYWjAZ1VEbbVduX54/edit?usp=sharing) | **Created** |
| Implementation | [Eduard Manta](mailto:eduard.manta@canonical.com) | Pending Review | 13 Nov 2026 |
|  | **Reviewer(s)** | **Status** | **Date** |
|  | [Alvaro Mateo Alvarez](mailto:alvaro.mateoalvarez@canonical.com) | Approved | 13 Nov 2026 |
|  | [Steve Rydz](mailto:steve.rydz@canonical.com) | Approved | 13 Nov 2026 |

# Abstract

We want to generalize the logic for "special" publishers to handle more publishers. Select Partners (mostly OEMs) are interested in publishing snaps, but would also like to have a custom publisher profile page where to showcase them.

# Rationale

We already have an existing flow to enable a semi-custom publisher page for select publishers. The publisher pages for Jetbrains, KDE and Snapcrafters display content fetched from a series of .yaml files stored in the repository. The template for the three pages is identical, but the content and the various sections are determined by the .yaml files’ content.

The limited number of Partners that will join the program from the start and the fact that we already have an existing flow for select publishers means we can adapt the functionality we already have to this new requirement. Introducing a CMS-like component would be an overcomplication, the Partners expressed no interest in managing their publisher pages themselves. If they *really* want to though, we gladly accept PRs :^)

Only verified publishers get a custom page (with Snapcrafters being the only exception), this rule is expected to remain the same as trusted Partners’ accounts are expected to be verified.

# Specification

To adapt what we have currently we need to make some changes to the publisher page route handler. The basic idea of handling content via yaml files will remain the same, as will the HTML template structure, and the pages’ appearance and behavior (at least in a first pass), but we will refactor the code to make it more generic.

Overview of the work:

1. Refactor the current code to create two separate functions that will render the custom publisher page or the default one; the route handler simply detects the publisher name, verifies whether it has a custom page, and redirects to the appropriate handler.  
2. Remove the `snapcrafters-snaps.yaml` file and merge its content into the `snapcrafters.yaml` file; this is not strictly necessary, but will make maintenance easier and enable us to use the solution described in the next point.  
3. Replace the hardcoded `if publisher in [...]` we currently have with filesystem-based routing using `<name>.yaml` file names; publisher `<name>` values are lowercase, so this should be the case for these files as well.  
   1. Load the publisher list (or just their names) in memory at startup  
   2. Avoid mutating the content parsed from the file like we’re doing now (unless we read the .yaml every time)  
4. Refactor the structure of the `<name>.yaml` files.  
   1. Define a formal schema  
   2. Migrate existing files to new schema  
   3. Add tests to CI checks that verify that all files are filled out correctly and render without issues

## Proposed new schema

### **Sample custom publisher page file**

```
# webapp/store/content/publishers/<name>.yaml
# The filename is the publisher id -> snapcraft.io/publisher/<name>

# Page heading
display_name: Snapcrafters                   # required
icon_url: https://...                        # optional, default or no icon if not set
website: https://github.com/snapcrafters     # optional
contact: mailto:snap-advocacy@canonical.com  # optional
banner_url: https://assets.ubuntu.com/...    # optional

# Details
summary: We are a group of ...               # required
description: |                               # required, accepts HTML
  <h2 class="p-heading--4">What is ...</h2>
publisher_since: July 2017                   # required
meta_description: ...                        # optional, used for SEO

# Snaps showcase
featured_snaps:                              # optional, up to two elements
  - package_name: intellij-idea
    background: "#000000"                    # required, must be a valid hex color
    description: IntelliJ IDEA is ...         # required

listed_snaps:                                # optional, if set it only displays these snaps
  - package_name: sublime-text
  - package_name: obs-studio
```

### **Formal YAML Schema**

```yaml
$schema: "http://json-schema.org/draft-07/schema#"
type: object
additionalProperties: false
required:
  - display_name
  - summary
  - description
  - publisher_since
properties:
  display_name:
    type: string
  icon_url:
    type: string
    format: uri
  website:
    type: string
    format: uri
  contact:
    type: string
  banner_url:
    type: string
    format: uri
  summary:
    type: string
  description:
    type: string
  publisher_since:
    type: string
  meta_description:
    type: string
  featured_snaps:
    type: array
    maxItems: 2
    items:
      type: object
      additionalProperties: false
      required:
        - package_name
        - background
        - description
      properties:
        package_name:
          type: string
        background:
          type: string
          pattern: "^#[0-9a-fA-F]{6}$"
        description:
          type: string
  listed_snaps:
    type: array
    items:
      type: object
      additionalProperties: false
      required:
        - package_name
      properties:
        package_name:
          type: string
```

Note: the schema above will NOT be used in the repo as-is. It’s only to be intended as a reference to implement a custom Python validator class for the content parsed from the .yaml files.

Content files are validated at application startup; invalid files are excluded from the custom publisher page registry, their names are logged and startup continues.
All content .yaml files will be validated during CI to ensure they match the schema.

### **Differences with current schema**

These are the main differences between the new schema and the current one:

1. The current schema is inconsistent and undocumented; the new schema is formally defined, will be validated and will have a series of tests to enforce it during CI.  
2. The filename will be equal to the `username` from the current schema, so the `username` key in the file goes away.  
3. `publisher` renamed to `display_name`; it makes more sense in the context.  
4. The validation badge comes from the API. The `developer_validation` key goes away, and the page uses `publisher.validation` from the store, like the community page does.  
5. The snap list layout is inferred from `listed_snaps`:  
   - If the list is not empty, the page shows those snaps (is available) and the “See all snaps published by \<publisher\>” link.  
   - If not, the page shows all snaps, except the `featured_snaps`.  
   - `show_popular_snaps`, `hide_all_snaps` and `link_to_search` keys are deleted.  
6. `blog_slug` goes away because it’s not being used anyway.

## UX

* **Who is this intended for?**  
  Select Partners that publish snaps, snap consumers  
* **Why are we doing this?**  
  At the moment, Partners don’t have a way to connect their corporate identity or showcase the packages they publish. This means that Partners’ publisher pages and their officially published snaps might not be immediately recognizable.  
* **What is the benefit to the user, and/or experience? To the business?**  
  Users will be able to easily recognize Partners’ publisher pages and their showcased snaps. Partners will be able to customize their brand presence and promote their published packages effectively.  
* **How will we know if it worked?**  
  Positive feedback from participating Partners. Increase in traffic and engagement on the new custom publisher pages for participating Partners.

## Security

Given the small scope of the feature, the security implications of the changes will be quite small.

### **Publisher account enumeration**

We maintain the current behavior where publisher pages never return 404 when a publisher account does not exist or has no public snaps. This prevents the endpoint from providing an account-existence signal through its HTTP status, which could facilitate targeted attacks.  
The `snap-quarantine` account remains the only explicit exception and always returns 404\.  
For any syntactically valid publisher URL, a successful Store response containing an empty list of snaps always results in HTTP 200 and the applicable default or custom publisher page with an empty list of snaps.

### **Publisher pages content**

The .yaml files that carry the publisher pages content could be used as an attack vector. Since the pages’ content will be statically built into the website code, the only ways to inject malicious code or assets is to pass a code review, merge and deploy. A good code review should be able to catch any malicious contribution; we will also add instructions for code review agents to verify the countermeasures are being applied correctly.

#### Script injection

| Description | Publisher page contains a malicious script |
| :---- | :---- |
| **Impact** | User session executes arbitrary code |
| **Necessary conditions for an attack** | The attacker can inject the malicious script or a link to it into one of the .yaml files |
| **Countermeasures** | Reject PRs that insert \<script\> tags or anchors with href=“javascript:” in the HTML parts of the .yaml |

#### Asset injection

| Description | Publisher page contains a malicious asset |
| :---- | :---- |
| **Impact** | User session displays an asset that contains malicious content |
| **Necessary conditions for an attack** | The attacker controls the source of the linked asset |
| **Countermeasures** | All linked assets must be hosted on assets.ubuntu.com; upload the assets there during the review process and ask contributors to update the links, reject the PR otherwise. |

#### Content injection

| Description | Publisher page content can be manipulated outside of the intended means |
| :---- | :---- |
| **Impact** | User session displays content that differs from what is directly shown the .yaml |
| **Necessary conditions for an attack** | The attacker can inject a content source they control in of the .yaml files |
| **Countermeasures** | Reject PRs that contain \<embed\> or \<iframe\> tags |

# Spec History and Changelog

Please be thorough when recording changes and progress with the spec itself and the work resulting from it. Record every meeting, attendees and conclusions from the meeting.

| Author(s) | Status | Date | Comment |
| :---- | :---- | :---- | :---- |
| [Eduard Manta](mailto:eduard.manta@canonical.com) | Braindump | 12 Nov 2026 | Brain dump |
| [Eduard Manta](mailto:eduard.manta@canonical.com) | Pending Review | 13 Nov 2026 | Ready for review |
| [Alvaro Mateo Alvarez](mailto:alvaro.mateoalvarez@canonical.com) | Approved | 13 Nov 2026 | LGTM |
| [Steve Rydz](mailto:steve.rydz@canonical.com) | Approved | Nov 13, 2026 | LGTM |
