import { vi } from "vitest";

import initCopyCommand from "../copyCommand";

describe("copy install command", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    initCopyCommand();
  });

  beforeEach(() => {
    writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("copies the command and shows success feedback", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <pre id="install-command"> sudo snap install test-snap </pre>
      <button
        data-js="copy-install-command"
        data-copy-target="install-command"
        title="Copy to clipboard"
      >
        <i class="p-icon--copy"></i>
      </button>
    `;

    document
      .querySelector<HTMLButtonElement>("[data-js='copy-install-command']")!
      .click();
    await Promise.resolve();

    const button = document.querySelector<HTMLButtonElement>(
      "[data-js='copy-install-command']",
    )!;
    const icon = button.querySelector("i")!;

    expect(writeText).toHaveBeenCalledWith("sudo snap install test-snap");
    expect(icon.className).toBe("p-icon--success");
    expect(button.title).toBe("Copied!");

    vi.advanceTimersByTime(2000);

    expect(icon.className).toBe("p-icon--copy");
    expect(button.title).toBe("Copy to clipboard");
  });

  test("uses the closest copy button when a nested element is clicked", async () => {
    document.body.innerHTML = `
      <code id="install-command">snap install nested</code>
      <button data-js="copy-install-command" data-copy-target="install-command">
        <i class="p-icon--copy"></i>
      </button>
    `;

    document.querySelector<HTMLElement>("i")!.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("snap install nested");
  });

  test("does nothing when the button has no target", () => {
    document.body.innerHTML = `
      <button data-js="copy-install-command">
        <i class="p-icon--copy"></i>
      </button>
    `;

    document
      .querySelector<HTMLButtonElement>("[data-js='copy-install-command']")!
      .click();

    expect(writeText).not.toHaveBeenCalled();
  });

  test("does nothing when the target element is missing", () => {
    document.body.innerHTML = `
      <button data-js="copy-install-command" data-copy-target="missing">
        <i class="p-icon--copy"></i>
      </button>
    `;

    document
      .querySelector<HTMLButtonElement>("[data-js='copy-install-command']")!
      .click();

    expect(writeText).not.toHaveBeenCalled();
  });

  test("does nothing when the target text is empty", () => {
    document.body.innerHTML = `
      <code id="install-command"> </code>
      <button data-js="copy-install-command" data-copy-target="install-command">
        <i class="p-icon--copy"></i>
      </button>
    `;

    document
      .querySelector<HTMLButtonElement>("[data-js='copy-install-command']")!
      .click();

    expect(writeText).not.toHaveBeenCalled();
  });
});
