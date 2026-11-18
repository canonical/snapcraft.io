import declareGlobal from "../libs/declare";
import { trackFeaturedSnapClicked } from "../store/utils/featuredTracker";

function init(): void {
  const switches = document.querySelectorAll<HTMLElement>(
    "[data-js='featured-category-switch']",
  );
  const panels = document.querySelectorAll<HTMLElement>(
    "[data-js='featured-category-panel']",
  );

  switches.forEach((featuredCategorySwitch) => {
    featuredCategorySwitch.addEventListener("click", (e: Event) => {
      e.preventDefault();

      const category = featuredCategorySwitch.dataset.category?.toLowerCase();

      if (!category) {
        return;
      }

      switches.forEach((el) => {
        const attr = el.classList.contains("p-tabs__link")
          ? "aria-selected"
          : "aria-current";
        if (el.dataset.category?.toLowerCase() === category) {
          el.setAttribute(attr, attr === "aria-selected" ? "true" : "page");
        } else if (attr === "aria-selected") {
          el.setAttribute(attr, "false");
        } else {
          el.removeAttribute(attr);
        }
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.category !== category;
      });
    });
  });

  panels.forEach((panel) => {
    if (panel.dataset.category !== "featured") {
      return;
    }

    panel.addEventListener("click", (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-js='featured-snap-card']",
      );

      if (card?.dataset.snapName && card.dataset.position) {
        trackFeaturedSnapClicked(
          card.dataset.snapName,
          Number(card.dataset.position),
          "home",
        );
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
    if (response.status === 204) {
      if (statsSection) statsSection.hidden = true;
      return;
    }
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
