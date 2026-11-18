# Main baseline capture artifacts

These artifacts are for OpenSpec change `custom-partner-publisher-pages` task 1.3.

## Source revision

- Main revision: `f0ee8c17fd8a8d302e040e284e3b5351c855ea0d`

## Capture workflow

1. Export the recorded main revision into `source-export/<revision>/`.
2. Ensure built assets exist in this branch: `workshop run -- yarn build`.
3. Run `node tests/e2e/capture-main-baselines.mjs`.
3. Review generated artifacts in this directory:
   - `html/*.html` (4 pages)
   - `screenshots/*.png` (9 screenshots)
   - `store-fixtures.captured.json`
   - `observations.json`
   - `provenance.json`

The capture script serves the exported main code with fixture-backed Store
responses and aborts GA/GTM network requests while recording attempted request
URLs as observations.

To keep screenshots styled, the script runs the exported app in production mode
and copies this branch's built Vite assets (`static/js/dist/vite`) into the
export before capture.
