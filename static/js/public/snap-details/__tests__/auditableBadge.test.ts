import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/dom";
import { vi } from "vitest";
import { trackEvent } from "@canonical/analytics-events";
import initAuditableBadge from "../auditableBadge";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

const SNAP_NAME = "mumble";

const AUDITABLE = {
  auditable: true,
  status: "verified",
  revision: 1721,
  architecture: "amd64",
  commit_sha: "10c7c9e1234567890",
  github_repository: "snapcrafters/mumble",
  commit_url: "https://github.com/snapcrafters/mumble/commit/10c7c9e1234567890",
  build_id: "216436",
  build_url: "https://launchpad.net/~build.snapcraft.io/+snap/x/+build/216436",
};

describe("auditable badge", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-js="auditable-badge" data-snap-name="${SNAP_NAME}"></div>
    `;
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  function mockFetch(response: unknown, ok = true) {
    window.fetch = vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(response),
    }) as unknown as typeof window.fetch;
  }

  it("renders a commit link when auditable", async () => {
    mockFetch(AUDITABLE);
    initAuditableBadge();

    await waitFor(() => {
      const link = document.querySelector(
        '[data-js="auditable-commit-link"]',
      ) as HTMLAnchorElement;
      expect(link).toBeInTheDocument();
      expect(link.href).toBe(AUDITABLE.commit_url);
      expect(link.textContent).toBe("10c7c9e");
    });

    expect(document.body.textContent).toContain("rev1721/amd64");
    expect(trackEvent).toHaveBeenCalledWith("provenance_badge_shown", {
      state: "verified",
    });
  });

  it("fires a commit click event", async () => {
    mockFetch(AUDITABLE);
    initAuditableBadge();

    await waitFor(() => {
      expect(
        document.querySelector('[data-js="auditable-commit-link"]'),
      ).toBeInTheDocument();
    });

    (
      document.querySelector(
        '[data-js="auditable-commit-link"]',
      ) as HTMLAnchorElement
    ).click();

    expect(trackEvent).toHaveBeenCalledWith("provenance_commit_click", {
      location: "badge",
    });
  });

  it("shows the not-provided message when there is no public source", async () => {
    mockFetch({
      auditable: false,
      status: "not-provided",
      revision: 171,
      architecture: "arm64",
    });
    initAuditableBadge();

    await waitFor(() => {
      expect(
        document.querySelector('[data-js="auditable-badge-not-provided"]'),
      ).toBeInTheDocument();
    });

    expect(document.body.textContent).toContain(
      "No public provenance for this revision",
    );
    expect(trackEvent).toHaveBeenCalledWith("provenance_badge_shown", {
      state: "not-provided",
    });
  });

  it("shows the unavailable message when the revision has no build", async () => {
    mockFetch({
      auditable: false,
      status: "unavailable",
      revision: 171,
      architecture: "arm64",
      github_repository: "snapcrafters/mumble",
    });
    initAuditableBadge();

    await waitFor(() => {
      expect(
        document.querySelector('[data-js="auditable-badge-unavailable"]'),
      ).toBeInTheDocument();
    });

    expect(document.body.textContent).toContain("rev171/arm64");
    expect(document.body.textContent).toContain(
      "Build provenance unavailable for this revision",
    );
    expect(trackEvent).toHaveBeenCalledWith("provenance_badge_shown", {
      state: "unavailable",
    });
  });

  it("shows an error message when the backend reports an error", async () => {
    mockFetch({
      auditable: false,
      status: "error",
      revision: 171,
      architecture: "arm64",
    });
    initAuditableBadge();

    await waitFor(() => {
      expect(
        document.querySelector('[data-js="auditable-badge-error"]'),
      ).toBeInTheDocument();
    });

    expect(document.body.textContent).toContain("rev171/arm64");
    expect(document.body.textContent).toContain(
      "Couldn't load provenance right now",
    );
    expect(trackEvent).toHaveBeenCalledWith("provenance_badge_shown", {
      state: "error",
    });
  });

  it("reports an error state on fetch failure", async () => {
    window.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    initAuditableBadge();

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("provenance_badge_shown", {
        state: "error",
      });
    });
  });
});
