import { trackEvent } from "@canonical/analytics-events";

/**
 * Attach click tracking to the provenance commit/build links within `root`.
 * Shared by the auditable badge and the security tab, which use the same
 * `*-commit-link` / `*-build-link` data-js suffixes and differ only in the
 * reported `location`.
 */
export function bindProvenanceClicks(root: ParentNode, location: string): void {
  root
    .querySelectorAll('[data-js$="commit-link"]')
    .forEach((link) =>
      link.addEventListener("click", () =>
        trackEvent("provenance_commit_click", { location }),
      ),
    );

  root
    .querySelectorAll('[data-js$="build-link"]')
    .forEach((link) =>
      link.addEventListener("click", () =>
        trackEvent("provenance_build_click", { location }),
      ),
    );
}
