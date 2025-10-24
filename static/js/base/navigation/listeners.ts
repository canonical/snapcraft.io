import {
  expandDropdown,
  collapseDropdown,
  setFocusable,
  setActiveDropdown,
  setupAnimationStart,
} from "./dropdownUtils";

const ANIMATION_DURATION = 333;

export const initNavigationListeners = () => {
  const navigation = document.querySelector(
    ".p-navigation--sliding",
  )! as HTMLElement;
  const menuButton = document.querySelector(
    ".p-navigation__banner .p-navigation__toggle--open",
  )! as HTMLElement;
  // all-canonical-link has it's own toggle listener coming from global-nav
  const toggles = [
    ...document.querySelectorAll(
      ".p-navigation__nav .p-navigation__link[aria-controls]:not(.js-back-button)",
    ),
  ]
    .map((element) => element as HTMLElement)
    .filter((htmlElement) => htmlElement.id !== "all-canonical-link");
  const topNavItemsLists = document.querySelectorAll(
    ".p-navigation__nav > .p-navigation__items",
  );
  const dropdownLinksLists = document.querySelectorAll(
    ".p-navigation__dropdown",
  );

  // global-nav related elements to fix certain problems for mobile view
  const desktopGlobalNav = document.getElementById("all-canonical-desktop")!;
  const overlayGlobalNav = document.getElementById("all-canonical-overlay")!;
  const togglesGlobalNav = [
    ...document.querySelectorAll(
      "#all-canonical-mobile button.global-nav__header-link-anchor",
    ),
  ].map((element) => element as HTMLElement);

  /**
   * Collapses all dropdowns with an optional exception.
   *
   * @param excludedToggle a toggle Element that is to be excluded from the reset.
   */
  const collapseAllDropdowns = (excludedToggle?: HTMLElement) => {
    toggles.forEach((toggle) => {
      const ariaControls = toggle.getAttribute("aria-controls");
      if (ariaControls) {
        const target = document.getElementById(ariaControls);
        if (!target || target === excludedToggle) {
          return;
        }
        collapseDropdown(toggle, target);
      }
    });
    togglesGlobalNav.forEach((toggle) => {
      const parent = toggle.parentElement;
      const dropdownContents = parent?.querySelector(
        ":scope > .p-navigation__dropdown",
      );
      if (dropdownContents) {
        collapseDropdown(toggle, dropdownContents as HTMLElement);
      }
    });
  };

  const resetNavigation = () => {
    navigation.classList.add("menu-closing");

    const closeMenuHandler = () => {
      navigation.classList.remove("has-menu-open");
      navigation.classList.remove("menu-closing");
      desktopGlobalNav.classList.remove("show-content");
      overlayGlobalNav.classList.remove("show-overlay");
      collapseAllDropdowns();
    };

    // the time is aproximately the time of the sliding animation
    setTimeout(closeMenuHandler, ANIMATION_DURATION);
  };

  const unfocusAllLinks = () => {
    // turn off focusability for all dropdown lists in the navigation
    dropdownLinksLists.forEach((list) => {
      const elements = list.querySelectorAll("ul > li > a, ul > li > button");
      elements.forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });
    });
  };

  const goBackOneLevel = (e: Event, backButton: HTMLElement) => {
    e.preventDefault();
    const target = backButton.closest(".p-navigation__dropdown");
    if (target && target.parentNode) {
      unfocusAllLinks();
      if (target.parentNode.parentNode) {
        setFocusable(target.parentNode.parentNode as Element);
      }

      const links = target.parentNode.querySelector(".p-navigation__link");
      if (links && links instanceof HTMLElement) {
        links.focus();
      }

      target.setAttribute("aria-hidden", "true");
      setActiveDropdown(backButton, false);
    }
  };

  const handleMenuButtonClick = (e: Event) => {
    e.preventDefault();

    if (navigation.classList.contains("has-menu-open")) {
      resetNavigation();
      menuButton.innerHTML = "Menu";
      // reshow scroll bar
      document.body.style.overflow = "visible";
    } else {
      navigation.classList.add("has-menu-open");
      unfocusAllLinks();
      menuButton.innerHTML = "Close menu";
      for (const topNavItemsList of topNavItemsLists) {
        setFocusable(topNavItemsList);
      }
      // hide scroll bar
      document.body.style.overflow = "hidden";
    }
  };

  const handleClickOutsideNavigation = (e: Event) => {
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      // check if the click was outside the navigation
      const topNavigationElement = target.closest(
        ".p-navigation, .p-navigation--sliding, .p-navigation--reduced",
      );
      if (!topNavigationElement) {
        resetNavigation();
        // set js-animation-playing on all open dropdowns
        setupAnimationStart(toggles, ANIMATION_DURATION);
      }
    }
  };

  const handleToggle = (e: Event, toggle: HTMLElement) => {
    e.preventDefault();

    const ariaControls = toggle.getAttribute("aria-controls");
    if (ariaControls) {
      const target = document.getElementById(ariaControls);
      if (target && target.parentNode) {
        // check if the toggled dropdown is child of another dropdown
        const isNested = !!(target.parentNode as HTMLElement).closest(
          ".p-navigation__dropdown",
        );

        if (!isNested) {
          collapseAllDropdowns(target);
        }

        if (target.getAttribute("aria-hidden") === "true") {
          unfocusAllLinks();
          expandDropdown(toggle, target);
          navigation.classList.add("has-menu-open");
        } else {
          collapseDropdown(toggle, target);
          if (!isNested) {
            navigation.classList.remove("has-menu-open");
          }
        }
      }
    }

    e.stopPropagation();
  };

  const handledropdownLinksLists = (e: Event, dropdown: HTMLElement) => {
    if (
      e instanceof KeyboardEvent &&
      e.shiftKey &&
      e.key === "Tab" &&
      window.getComputedStyle(dropdown.children[0], null).display === "none"
    ) {
      const backButton = dropdown.children[1].children[0] as HTMLElement;
      goBackOneLevel(e, backButton);
      const focusElement = dropdown.parentNode?.children[0] as HTMLElement;
      focusElement?.focus({ preventScroll: true });
    }
  };

  const handleGoBackOneLevel = (e: Event, backButton: HTMLElement) => {
    goBackOneLevel(e, backButton);
  };

  // add listeners to control the navigation
  menuButton.addEventListener("click", handleMenuButtonClick);
  toggles.forEach((toggle) => {
    const handler = (e: Event) => handleToggle(e, toggle);
    toggle.addEventListener("click", handler);
  });
  dropdownLinksLists.forEach((dropdown) => {
    const handler = (e: Event) =>
      handledropdownLinksLists(e, dropdown as HTMLElement);
    dropdown.children[1].addEventListener("keydown", handler);
  });

  document.querySelectorAll(".js-back-button").forEach((backButton) => {
    const handler = (e: Event) =>
      handleGoBackOneLevel(e, backButton as HTMLElement);
    backButton.addEventListener("click", handler);
  });

  // when clicking outside navigation, close all dropdowns
  document.addEventListener("click", handleClickOutsideNavigation);
};
