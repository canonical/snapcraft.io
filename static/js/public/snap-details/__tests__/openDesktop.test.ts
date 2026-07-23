import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";

import openDesktop, {
  applyDesktopStoreSupport,
  isDesktopStoreSupported,
} from "../openDesktop";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("@canonical/analytics-events", () => ({ trackEvent }));

const LINUX_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const CROS_UA =
  "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const BLOCK_HTML = `
  <div data-js="open-desktop-block" class="u-hide">
    <p>Ubuntu 16.04 or later?</p>
    <button
      data-snap="test-snap?channel=latest/beta"
      class="p-button p-view-store-button"
      data-js="open-desktop"
      data-analytics-click
      data-analytics-target="details_view_in_desktop_store"
      data-shown-event="open_desktop_shown"
      data-analytics-channel="latest/beta">View in Desktop store</button>
    <p class="p-form-help-text" data-js="open-desktop-help">Make sure snap support is enabled.</p>
    <div data-js="open-desktop-error"></div>
  </div>`;

function setUserAgent(ua: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
}

const block = () => document.querySelector('[data-js="open-desktop-block"]')!;
const button = () =>
  document.querySelector<HTMLButtonElement>('[data-js="open-desktop"]')!;
const helpText = () => document.querySelector('[data-js="open-desktop-help"]')!;
const errorHolder = () =>
  document.querySelector('[data-js="open-desktop-error"]')!;

describe("isDesktopStoreSupported", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    ["Linux", LINUX_UA, true],
    ["macOS", MAC_UA, false],
    ["Windows", WINDOWS_UA, false],
    ["Android", ANDROID_UA, false],
    ["ChromeOS", CROS_UA, false],
  ])("%s is %s", (_name, ua, expected) => {
    setUserAgent(ua);
    expect(isDesktopStoreSupported()).toBe(expected);
  });

  test("prefers userAgentData.platform when available", () => {
    Object.defineProperty(navigator, "userAgentData", {
      value: { platform: "Linux" },
      configurable: true,
    });

    try {
      setUserAgent(MAC_UA);
      expect(isDesktopStoreSupported()).toBe(true);
    } finally {
      delete (navigator as { userAgentData?: unknown }).userAgentData;
    }
  });
});

describe("applyDesktopStoreSupport", () => {
  beforeEach(() => {
    document.body.innerHTML = BLOCK_HTML;
    trackEvent.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  test("reveals the block on Linux", () => {
    setUserAgent(LINUX_UA);
    applyDesktopStoreSupport();
    expect(block()).not.toHaveClass("u-hide");
  });

  test("leaves the block hidden on unsupported platforms", () => {
    setUserAgent(MAC_UA);
    applyDesktopStoreSupport();
    expect(block()).toHaveClass("u-hide");
  });

  test("reports an impression when the block is revealed", () => {
    setUserAgent(LINUX_UA);
    applyDesktopStoreSupport();
    expect(trackEvent).toHaveBeenCalledWith("open_desktop_shown", {
      channel: "latest/beta",
    });
  });

  test("does not report an impression on unsupported platforms", () => {
    setUserAgent(MAC_UA);
    applyDesktopStoreSupport();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  test("does not report a second impression for an already-visible block", () => {
    setUserAgent(LINUX_UA);
    applyDesktopStoreSupport();
    applyDesktopStoreSupport();
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});

describe("openDesktop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = BLOCK_HTML;
    setUserAgent(LINUX_UA);
    applyDesktopStoreSupport();
    trackEvent.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  test("fires the snap:// URL with whitespace stripped", () => {
    openDesktop(button());

    const iframe = document.querySelector<HTMLIFrameElement>(
      ".js-snap-open-frame",
    )!;
    expect(iframe.getAttribute("src")).toEqual(
      "snap://test-snap?channel=latest/beta",
    );
  });

  test("enters the loading state on click", () => {
    openDesktop(button());

    expect(button()).toBeDisabled();
    expect(button()).toHaveClass("is-processing");
    expect(button().querySelector(".p-icon--spinner")).not.toBeNull();
  });

  test("returns to idle and reports success when the window blurs", () => {
    openDesktop(button());
    window.dispatchEvent(new Event("blur"));

    expect(button()).not.toBeDisabled();
    expect(button()).not.toHaveClass("is-processing");
    expect(button()).toHaveTextContent("View in Desktop store");
    expect(errorHolder()).toBeEmptyDOMElement();
    expect(trackEvent).toHaveBeenCalledWith(
      "details_view_in_desktop_store_success",
      { channel: "latest/beta" },
    );
  });

  test("reports success when the document becomes hidden", () => {
    openDesktop(button());
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(trackEvent).toHaveBeenCalledWith(
      "details_view_in_desktop_store_success",
      { channel: "latest/beta" },
    );
  });

  test("shows an error and reports it when nothing happens in time", () => {
    openDesktop(button());
    vi.advanceTimersByTime(1500);

    expect(button()).not.toBeDisabled();
    expect(
      errorHolder().querySelector(".p-notification--caution"),
    ).not.toBeNull();
    expect(errorHolder()).toHaveTextContent(/Couldn't open the Desktop Store/);
    expect(helpText()).toHaveClass("u-hide");
    expect(trackEvent).toHaveBeenCalledWith(
      "details_view_in_desktop_store_error",
      { channel: "latest/beta" },
    );
  });

  test("does not report twice when the timeout follows a success", () => {
    openDesktop(button());
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(1500);

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(errorHolder()).toBeEmptyDOMElement();
  });

  test("clears a previous error on the next click", () => {
    openDesktop(button());
    vi.advanceTimersByTime(1500);
    expect(errorHolder()).not.toBeEmptyDOMElement();

    openDesktop(button());
    expect(errorHolder()).toBeEmptyDOMElement();
    expect(helpText()).not.toHaveClass("u-hide");
  });

  test("ignores clicks while already loading", () => {
    openDesktop(button());
    openDesktop(button());
    vi.advanceTimersByTime(1500);

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});
