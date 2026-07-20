import "@testing-library/jest-dom";
import { vi } from "vitest";
import initDetailsTabs from "../detailsTabs";

function setupDom() {
  document.body.innerHTML = `
    <a data-js="details-tab" aria-controls="tab-description" aria-selected="true">Description</a>
    <a data-js="details-tab" aria-controls="tab-security" aria-selected="false">Security</a>
    <div id="tab-description" data-js="details-tabpanel">desc</div>
    <div id="tab-security" class="u-hide" data-js="details-tabpanel">sec</div>
  `;
}

const tab = (controls: string) =>
  document.querySelector<HTMLAnchorElement>(
    `[data-js="details-tab"][aria-controls="${controls}"]`,
  )!;
const panel = (id: string) => document.getElementById(id)!;

describe("details tabs", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", " ");
    vi.restoreAllMocks();
  });

  it("switches panels and reflects the tab in the URL hash on click", () => {
    setupDom();
    initDetailsTabs();

    tab("tab-security").click();

    expect(tab("tab-security")).toHaveAttribute("aria-selected", "true");
    expect(tab("tab-description")).toHaveAttribute("aria-selected", "false");
    expect(panel("tab-security")).not.toHaveClass("u-hide");
    expect(panel("tab-description")).toHaveClass("u-hide");
    expect(window.location.hash).toBe("#tab-security");
  });

  it("restores the tab from the URL hash on load", () => {
    setupDom();
    window.history.replaceState(null, "", "#tab-security");

    initDetailsTabs();

    expect(tab("tab-security")).toHaveAttribute("aria-selected", "true");
    expect(panel("tab-security")).not.toHaveClass("u-hide");
    expect(panel("tab-description")).toHaveClass("u-hide");
  });

  it("ignores an unrelated hash", () => {
    setupDom();
    window.history.replaceState(null, "", "#something-else");

    initDetailsTabs();

    expect(tab("tab-description")).toHaveAttribute("aria-selected", "true");
    expect(panel("tab-security")).toHaveClass("u-hide");
  });
});
