import { vi } from "vitest";
import { trackFeaturedSnapClicked } from "../store/utils/featuredTracker";
import "./featured-snaps";

vi.mock("../store/utils/featuredTracker", () => ({
  trackFeaturedSnapClicked: vi.fn(),
}));

const card = (name: string, position: number) => `
  <div data-js="featured-snap-card" data-snap-name="${name}" data-position="${position}"></div>`;

describe("featured snaps", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a href="#" data-js="featured-category-switch" data-category="Featured" aria-current="page">Featured</a>
      <a href="#" data-js="featured-category-switch" data-category="Games">Games</a>
      <div data-js="featured-category-panel" data-category="featured">${card("a", 1)}${card("b", 2)}</div>
      <div class="u-hide" data-js="featured-category-panel" data-category="games">${card("c", 1)}</div>
      <ul><li>
        <a href="/search?categories=featured" data-js="featured-category-panel" data-category="featured">View all featured snaps</a>
        <a href="/search?categories=games" class="u-hide" data-js="featured-category-panel" data-category="games">View all games snaps</a>
      </li></ul>`;

    window.snapcraft.public.featuredSnaps.init();
    vi.clearAllMocks();
  });

  it("shows the selected category and hides the others", () => {
    const [, games] = document.querySelectorAll<HTMLElement>(
      "[data-js='featured-category-switch']",
    );
    games.click();

    const panels = document.querySelectorAll(
      "[data-js='featured-category-panel']",
    );
    const hidden = Array.from(panels).map((panel) =>
      panel.classList.contains("u-hide"),
    );
    // cards panels, then "view all" link items
    expect(hidden).toEqual([true, false, true, false]);
    expect(games.getAttribute("aria-current")).toBe("page");
    expect(
      document
        .querySelector("[data-category='Featured']")
        ?.hasAttribute("aria-current"),
    ).toBe(false);
  });

  it("tracks clicks on featured snaps only", () => {
    const cards = document.querySelectorAll<HTMLElement>(
      "[data-js='featured-snap-card']",
    );
    cards[1].click();
    expect(trackFeaturedSnapClicked).toHaveBeenCalledWith("b", 2, "home");

    cards[2].click();
    expect(trackFeaturedSnapClicked).toHaveBeenCalledTimes(1);
  });
});
