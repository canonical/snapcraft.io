# Custom publisher page content

This directory contains custom content files for publisher pages at:

- `/publisher/<publisher-id>`

Each publisher file must be named `<publisher-id>.yaml` using lowercase letters.

## Validate content locally

Run the validator before opening a PR:

```bash
workshop exec -- env PYTHONPATH=. python3 scripts/validate-publisher-content.py \
  --content-dir webapp/store/content/publishers
```

The command exits non-zero on errors and reports the file and field.

At startup the registry is validated and any invalid file is logged and
skipped; the affected publisher falls back to the standard community page.
Adding or changing a publisher page requires a deploy to take effect.

## File schema

Required top-level fields:

- `display_name` (string)
- `summary` (string)
- `description` (string; may include reviewed HTML)
- `publisher_since` (string)

Optional top-level fields:

- `icon_url` (URI string; `https` only)
- `website` (URI string; `https` only)
- `contact` (URI string; `https` or `mailto`)
- `banner_url` (URI string; `https` only)
- `meta_description` (string)
- `featured_snaps` (array, max 2)
- `listed_snaps` (array)

No additional top-level fields are allowed.

### `featured_snaps`

Optional array with at most two items.

Each item must contain:

- `package_name` (string)
- `background` (string, six-digit hex color: `#RRGGBB`)
- `description` (string)

No additional fields are allowed in featured items.

### `listed_snaps`

Optional array.

Each item must contain:

- `package_name` (string)

No additional fields are allowed in listed items.

## Rendering behavior

- If `listed_snaps` is non-empty, the page shows only listed snaps that are
  currently public for that publisher.
- If `listed_snaps` is missing or empty, the page shows all returned public
  snaps except featured snaps.
- Snaps that are unavailable, deleted, private, or published by another
  publisher are omitted.
- If a snap is configured in both featured and listed sections, it should be
  kept only in featured.

## Security and review rules

These rules are reviewed by humans and are not fully enforced by the YAML validator:

- Custom pages are for verified publishers, with Snapcrafters as the known
  exception.
- Reject `<script>` tags and `javascript:` links.
- Reject `<iframe>` and `<embed>` tags.
- Linked assets must be hosted on `assets.ubuntu.com`.
- Do not put essential information only in icon or banner images.
- Description images must include meaningful `alt` text.
- Keep heading order logical inside `description` HTML.
- Ensure featured snap background colors keep text legible.

## Troubleshooting CI errors

Common failures from `validate-publisher-content.py`:

- `filename: publisher file names must be lowercase`
- `<field>: field is required`
- `<field>: field is not allowed in publisher content`
- `featured_snaps: must contain at most two snaps`
- `featured_snaps[n].background: must be a six-digit hex colour`
- `<root>: malformed YAML: ...`
- `<root>: publisher content file is empty`
