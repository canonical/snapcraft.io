import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/dom";
import { vi } from "vitest";
import { trackEvent } from "@canonical/analytics-events";
import initSecurityTab from "../securityTab";

vi.mock("@canonical/analytics-events", () => ({ trackEvent: vi.fn() }));

const SNAP = "mumble";

const RELEASES = [
  {
    track: "latest",
    risk: "stable",
    version: "1.0",
    revision: "1721",
    "released-at": "1 Jan 2024",
  },
];

const CHANNEL_MAP = {
  amd64: { latest: RELEASES },
};

const MULTI_ARCH_CHANNEL_MAP = {
  amd64: { latest: RELEASES },
  riscv64: { latest: RELEASES },
};

const REVISIONS = {
  github_repository: "snapcrafters/mumble",
  error: false,
  revisions: {
    "1721": {
      commit_sha: "10c7c9e0000",
      commit_url: "https://github.com/snapcrafters/mumble/commit/10c7c9e0000",
      build_id: "216436",
      build_url: "https://launchpad.net/~x/+snap/y/+build/216436",
    },
  },
};

function setupDom({ tabOpen = false } = {}) {
  document.body.innerHTML = `
    <a data-js="details-tab" aria-controls="tab-security"
       aria-selected="${tabOpen}">Security</a>
    <div id="js-security-tab">
      <select data-js="security-arch-select"></select>
      <table><tbody data-js="security-tab-table"></tbody></table>
    </div>
  `;
}

const tbodyHtml = () =>
  document.querySelector('[data-js="security-tab-table"]')?.innerHTML ?? "";

const openTab = () =>
  document.querySelector<HTMLElement>('[data-js="details-tab"]')?.click();

const mockFetch = () => {
  window.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(REVISIONS),
  }) as unknown as typeof fetch;
};

describe("security tab", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("populates the architecture selector from the channel map", () => {
    setupDom();
    window.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(REVISIONS),
    }) as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");

    const options = document.querySelectorAll(
      '[data-js="security-arch-select"] option',
    );
    expect(options).toHaveLength(1);
    expect(options[0].getAttribute("value")).toBe("amd64");
  });

  it("shows spinners first, then build and commit links", async () => {
    setupDom();
    let resolveFetch: () => void = () => {};
    window.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({ json: () => Promise.resolve(REVISIONS) });
        }),
    ) as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");
    openTab();

    // Table renders immediately with a loading spinner in the cells.
    expect(tbodyHtml()).toContain("p-icon--spinner");

    resolveFetch();

    await waitFor(() => {
      expect(
        document.querySelector('[data-js="security-build-link"]'),
      ).toBeInTheDocument();
    });
    expect(
      document.querySelector('[data-js="security-commit-link"]')?.textContent,
    ).toContain("10c7c9e");
  });

  it("shows an error banner when provenance fails to load", async () => {
    setupDom();
    window.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");
    openTab();

    await waitFor(() => {
      expect(
        document.querySelector(".p-notification--caution"),
      ).toBeInTheDocument();
    });
  });

  it("does not fetch provenance until the tab is opened", async () => {
    setupDom();
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(REVISIONS),
    });
    window.fetch = fetchMock as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");

    expect(fetchMock).not.toHaveBeenCalled();

    openTab();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("fetches once however often the tab is clicked", async () => {
    setupDom();
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(REVISIONS),
    });
    window.fetch = fetchMock as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");
    openTab();
    openTab();
    openTab();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("fetches on init when deep-linked straight to the tab", async () => {
    setupDom({ tabOpen: true });
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(REVISIONS),
    });
    window.fetch = fetchMock as unknown as typeof fetch;

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("reports the tab opening on click", () => {
    setupDom();
    mockFetch();

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");
    openTab();

    expect(trackEvent).toHaveBeenCalledWith("provenance_security_tab_open");
  });

  it("reports the tab opening when deep-linked straight to the tab", () => {
    setupDom({ tabOpen: true });
    mockFetch();

    initSecurityTab("#js-security-tab", SNAP, CHANNEL_MAP, "amd64");

    expect(trackEvent).toHaveBeenCalledWith("provenance_security_tab_open");
  });

  it("reports the architecture switch without bucketing the value", () => {
    setupDom();
    mockFetch();

    initSecurityTab("#js-security-tab", SNAP, MULTI_ARCH_CHANNEL_MAP, "amd64");

    const select = document.querySelector<HTMLSelectElement>(
      '[data-js="security-arch-select"]',
    ) as HTMLSelectElement;
    select.value = "riscv64";
    select.dispatchEvent(new Event("change"));

    expect(trackEvent).toHaveBeenCalledWith("provenance_arch_switch", {
      provenance_arch: "riscv64",
    });
  });
});
