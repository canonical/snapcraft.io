import { vi } from "vitest";

vi.mock("../store/utils/featuredTracker", () => ({
  trackFeaturedSnapClicked: vi.fn(),
}));

import { trackFeaturedSnapClicked } from "../store/utils/featuredTracker";

const setup = async () => {
  document.body.innerHTML = `
    <a href="#" class="p-side-navigation__link" data-js="featured-category-switch" data-category="featured" aria-current="page">Featured</a>
    <a href="#" class="p-side-navigation__link" data-js="featured-category-switch" data-category="games">Games</a>
    <a href="#" class="p-tabs__link" data-js="featured-category-switch" data-category="featured" aria-selected="true">Featured</a>
    <a href="#" class="p-tabs__link" data-js="featured-category-switch" data-category="games">Games</a>
    <div data-js="featured-category-panel" data-category="featured">
      <a href="#" data-js="featured-snap-card" data-snap-name="alpha" data-position="2">alpha</a>
    </div>
    <div data-js="featured-category-panel" data-category="games" hidden></div>
  `;
  await import("./featured-snaps");
  (
    window as unknown as {
      snapcraft: { public: { featuredSnaps: { init: () => void } } };
    }
  ).snapcraft.public.featuredSnaps.init();
};

describe("featured snaps", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setup();
  });

  it("switches panels and sets the right state attribute per link type", () => {
    document
      .querySelectorAll<HTMLElement>(
        ".p-side-navigation__link[data-category='games']",
      )[0]
      .click();

    const panels = document.querySelectorAll<HTMLElement>(
      "[data-js='featured-category-panel']",
    );
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);

    const side = document.querySelectorAll(".p-side-navigation__link");
    expect(side[0].hasAttribute("aria-current")).toBe(false);
    expect(side[1].getAttribute("aria-current")).toBe("page");
    expect(side[1].hasAttribute("aria-selected")).toBe(false);

    const tabs = document.querySelectorAll(".p-tabs__link");
    expect(tabs[0].hasAttribute("aria-selected")).toBe(false);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].hasAttribute("aria-current")).toBe(false);
  });

  it("tracks clicks on featured cards", () => {
    document
      .querySelector<HTMLElement>("[data-js='featured-snap-card']")!
      .click();
    expect(trackFeaturedSnapClicked).toHaveBeenCalledWith("alpha", 2, "home");
  });
});
