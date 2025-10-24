export const setActiveDropdown = (
  dropdownToggleButton: HTMLElement,
  isActive = true,
) => {
  // set active state of the dropdown toggle (to slide the panel into view)
  const dropdownToggleEl = dropdownToggleButton.closest(
    ".p-navigation__item--dropdown-toggle",
  );
  if (dropdownToggleEl) {
    dropdownToggleEl.classList.toggle("is-active", isActive);
    dropdownToggleEl.classList.toggle("is-selected", isActive);
    const globalNavButton = dropdownToggleEl.querySelector(
      ":scope > .p-navigation__link",
    );
    // fix some states from global-nav elements in mobile
    if (globalNavButton) {
      globalNavButton.setAttribute("aria-expanded", isActive.toString());
      globalNavButton.classList.toggle("is-selected", isActive);
    }
  }

  // set active state of the parent dropdown panel (to fade it out of view)
  const parentLevelDropdown = dropdownToggleEl?.closest(
    ".p-navigation__dropdown",
  );
  if (parentLevelDropdown) {
    parentLevelDropdown.classList.toggle("is-active", isActive);
  }

  // set active state of the top navigation list under p-navigation__nav
  // to set the position of the sliding panel properly
  const topLevelNavigation = dropdownToggleButton.closest(".p-navigation__nav");
  if (topLevelNavigation) {
    const topLevelItems = topLevelNavigation.querySelectorAll(
      ":scope > .p-navigation__items",
    );

    for (const item of topLevelItems) {
      // in case there are more than one top level navigation lists, we need to
      // mark as active the one that contains the clicked button and hide the rest
      if (item.contains(dropdownToggleButton)) {
        item.classList.toggle("is-active", isActive);
      } else {
        item.classList.toggle("u-hide", isActive);
      }
    }
  }
};

export const setListFocusable = (list: Element) => {
  // turn on focusability for all direct children in the target dropdown
  if (list) {
    for (const item of list.children) {
      item.children[0].setAttribute("tabindex", "0");
    }
  }
};

export const setFocusable = (target: Element) => {
  // if target dropdown is not a list, find the list in it
  const isList =
    target.classList.contains("p-navigation__dropdown") ||
    target.classList.contains("p-navigation__items");

  if (!isList) {
    // find all lists in the target dropdown and make them focusable
    target.querySelectorAll(".p-navigation__dropdown").forEach((element) => {
      setListFocusable(element);
    });
  } else {
    setListFocusable(target);
  }
};

export const collapseDropdown = (
  dropdownToggleButton: HTMLElement,
  targetDropdown: HTMLElement,
) => {
  targetDropdown.setAttribute("aria-hidden", "true");
  setActiveDropdown(dropdownToggleButton, false);
};

export const expandDropdown = (
  dropdownToggleButton: HTMLElement,
  targetDropdown: HTMLElement,
) => {
  setActiveDropdown(dropdownToggleButton);
  targetDropdown.setAttribute("aria-hidden", "false");
  setFocusable(targetDropdown);
};

export const toggleAnimationPlaying = (
  element?: Element,
  animationDuration?: number,
) => {
  const endAnimation = () => {
    element?.classList.toggle("js-animation-playing", false);
  };
  element?.classList.toggle("js-animation-playing", true);
  setTimeout(endAnimation, animationDuration);
};

export const setupAnimationStart = (
  elements: Element[],
  animationDuration?: number,
) => {
  // get all open toggles to add the animation playing to them
  elements
    .filter(
      (toggle: Element): toggle is Element =>
        toggle.parentElement != null &&
        toggle.parentElement.classList.contains("is-active"),
    )
    .forEach((toggle: Element) => {
      toggleAnimationPlaying(toggle.parentElement!, animationDuration);
    });
};
