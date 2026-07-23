import { trackEvent } from "@canonical/analytics-events";

// How long to wait for the OS to hand off to the Desktop Store before we
// assume no `snap://` handler is registered.
const LAUNCH_TIMEOUT_MS = 1500;

const BLOCK_SELECTOR = '[data-js="open-desktop-block"]';
const HELP_SELECTOR = '[data-js="open-desktop-help"]';
const ERROR_SELECTOR = '[data-js="open-desktop-error"]';

const ERROR_MESSAGE =
  `Couldn't open the Desktop Store. Make sure ` +
  `<a href="/docs/installing-snapd">snap support</a> is enabled, or install ` +
  `this snap using the command below.`;

interface UserAgentData {
  platform?: string;
}

export function isDesktopStoreSupported(): boolean {
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;

  if (uaData && uaData.platform) {
    return uaData.platform === "Linux";
  }

  const ua = navigator.userAgent;

  // Android and ChromeOS both report a Linux kernel but have no snapd.
  return /Linux/.test(ua) && !/Android|CrOS/.test(ua);
}

export function applyDesktopStoreSupport(root: ParentNode = document): void {
  if (!isDesktopStoreSupported()) {
    return;
  }

  root.querySelectorAll(BLOCK_SELECTOR).forEach((block) => {
    if (!block.classList.contains("u-hide")) {
      return;
    }

    block.classList.remove("u-hide");

    const button = block.querySelector<HTMLElement>('[data-js="open-desktop"]');
    const shownEvent = button?.dataset.shownEvent;
    const channel = button?.dataset.analyticsChannel;

    if (shownEvent) {
      trackEvent(shownEvent, channel ? { channel } : {});
    }
  });
}

function clearError(block: Element | null): void {
  if (!block) {
    return;
  }

  const errorEl = block.querySelector(ERROR_SELECTOR);
  if (errorEl) {
    errorEl.innerHTML = "";
  }

  block.querySelector(HELP_SELECTOR)?.classList.remove("u-hide");
}

function showError(block: Element | null): void {
  if (!block) {
    return;
  }

  const errorEl = block.querySelector(ERROR_SELECTOR);
  if (!errorEl) {
    return;
  }

  // The help text below the button repeats the snapd advice, so hide it while
  // the notification is on screen.
  block.querySelector(HELP_SELECTOR)?.classList.add("u-hide");

  errorEl.innerHTML = `
    <div class="p-notification--caution is-inline u-no-margin--bottom" role="alert">
      <div class="p-notification__content">
        <p class="p-notification__message">${ERROR_MESSAGE}</p>
      </div>
    </div>`;
}

function setLoading(button: HTMLButtonElement): void {
  button.dataset.idleLabel = button.innerHTML;
  button.classList.add("is-processing", "has-icon");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.innerHTML = `<i class="p-icon--spinner u-animation--spin"></i>&nbsp;<span>Opening&hellip;</span>`;
}

function setIdle(button: HTMLButtonElement): void {
  if (button.dataset.idleLabel !== undefined) {
    button.innerHTML = button.dataset.idleLabel;
    delete button.dataset.idleLabel;
  }
  button.classList.remove("is-processing", "has-icon");
  button.disabled = false;
  button.removeAttribute("aria-busy");
}

function launch(name: string): void {
  const existing = document.querySelector(".js-snap-open-frame");
  existing?.parentNode?.removeChild(existing);

  const iframe = document.createElement("iframe");
  iframe.className = "js-snap-open-frame";
  iframe.style.position = "absolute";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.src = `snap://${name}`;
  document.body.appendChild(iframe);
}

export default function openDesktop(button: HTMLButtonElement): void {
  if (button.disabled) {
    return;
  }

  const block = button.closest(BLOCK_SELECTOR);
  const target = button.dataset.analyticsTarget;
  const channel = button.dataset.analyticsChannel;

  clearError(block);
  setLoading(button);

  let settled = false;
  let timer = 0;

  const finish = (success: boolean) => {
    if (settled) {
      return;
    }
    settled = true;

    window.clearTimeout(timer);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    setIdle(button);

    if (!success) {
      showError(block);
    }

    if (target) {
      trackEvent(
        `${target}_${success ? "success" : "error"}`,
        channel ? { channel } : {},
      );
    }
  };

  const onBlur = () => finish(true);
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      finish(true);
    }
  };

  timer = window.setTimeout(() => finish(false), LAUNCH_TIMEOUT_MS);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibilityChange);

  launch((button.dataset.snap || "").replace(/\s+/g, ""));
}
