import { createNav } from "@canonical/global-nav";

/**
 * Add custom listeners to control animation of dropdowns and be able to remove the
 * display of some hidden elements from global-nav that block clicks for underneath
 * elements (see WD-26684).
 *
 * We must set these listeners before the global-nav sets its own listeners for them
 * to work properly.
 */

const DROPDOWN_ANIMATION_DURATION = 333;
const toggles = [
  ...document.querySelectorAll(
    ".p-navigation__nav .p-navigation__link[aria-controls]:not(.js-back-button)"
  ),
].filter((element) => element.id !== "all-canonical-link");

const toggleAnimationPlaying = (element: Element) => {
  const endAnimation = () => {
    element.classList.toggle("js-animation-playing", false);
  };

  element.classList.toggle("js-animation-playing", true);
  setTimeout(endAnimation, DROPDOWN_ANIMATION_DURATION);
};

const setAnimationPlaying = () => {
  // get all open toggles to add the animation playing to them
  toggles
    .filter((toggle: Element): toggle is Element =>
      toggle.parentElement != null && toggle.parentElement.classList.contains("is-active")
    )
    .forEach((toggle: Element) => {
      toggleAnimationPlaying(toggle.parentElement!);
    });
};

const handleToggle = (e: Event, toggle: Element) => {
  e.preventDefault();

  const toggleParent = toggle.parentElement;
  if (toggleParent) {
    toggleAnimationPlaying(toggleParent);
  }

  e.stopPropagation();
};

toggles.forEach((toggle: Element) => {
  const handler = (e: Event) => handleToggle(e, toggle);
  toggle.addEventListener("click", handler);
});

// when clicking outside navigation, set js-animation-playing on all open dropdowns
document.addEventListener("click", setAnimationPlaying);

// Once our listeners are added then we run global-nav, which will add others
window.addEventListener("DOMContentLoaded", function () {
  createNav({ isSliding: true, closeMenuAnimationDuration: 200 });
});
