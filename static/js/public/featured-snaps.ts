import declareGlobal from "../libs/declare";
import { trackFeaturedSnapClicked } from "../store/utils/featuredTracker";

function init(): void {
  const featuredCategorySwitches = document.querySelectorAll(
    "[data-js='featured-category-switch']",
  );

  const panels = document.querySelectorAll<HTMLElement>(
    "[data-js='featured-category-panel']",
  );

  featuredCategorySwitches.forEach((featuredCategorySwitch) => {
    featuredCategorySwitch.addEventListener("click", (e: Event) => {
      e.preventDefault();

      const target = e.target as HTMLLinkElement;
      const category = target.dataset.category?.toLowerCase();

      document
        .querySelector("[data-js='featured-category-switch'][aria-current]")
        ?.removeAttribute("aria-current");
      document
        .querySelector("[data-js='featured-category-switch'][aria-selected]")
        ?.removeAttribute("aria-selected");

      target.setAttribute("aria-current", "page");
      target.setAttribute("aria-selected", "true");

      if (!category) {
        return;
      }

      panels.forEach((panel) => {
        panel.classList.toggle("u-hide", panel.dataset.category !== category);
      });
    });
  });

  document
    .querySelectorAll<HTMLElement>(
      "[data-js='featured-category-panel'][data-category='featured'] [data-js='featured-snap-card']",
    )
    .forEach((card) => {
      card.addEventListener("click", () => {
        const { snapName, position } = card.dataset;

        if (snapName && position) {
          trackFeaturedSnapClicked(snapName, Number(position), "home");
        }
      });
    });
}

async function initStats(): Promise<void> {
  const statsSection = document.querySelector(
    "[data-js='stats-section']",
  ) as HTMLElement | null;

  try {
    const response = await fetch("/store/stats");
    if (!response.ok) {
      if (statsSection) statsSection.hidden = true;
      return;
    }
    const stats = await response.json();

    const totalTracked = document.querySelector(
      "[data-js='stats-total-tracked']",
    );
    const updatedToday = document.querySelector(
      "[data-js='stats-updated-today']",
    );
    const newToday = document.querySelector("[data-js='stats-new-today']");

    if (totalTracked && stats.total_tracked != null) {
      totalTracked.textContent = stats.total_tracked.toLocaleString();
    }
    if (updatedToday && stats.updated_today != null) {
      updatedToday.textContent = stats.updated_today.toLocaleString();
    }
    if (newToday && stats.new_today != null) {
      newToday.textContent = stats.new_today.toLocaleString();
    }
  } catch (_) {
    if (statsSection) statsSection.hidden = true;
  }
}

declareGlobal("snapcraft.public.featuredSnaps", { init, initStats });
