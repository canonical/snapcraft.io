(function () {
  function toggleDropdown(toggle: HTMLElement, open: boolean) {
    const parentElement = toggle.parentNode as HTMLElement;
    const dropdownElId = toggle.getAttribute("aria-controls") as string;

    const dropdown = document.getElementById(dropdownElId) as HTMLElement;

    const openMenu = !open;

    dropdown.setAttribute("aria-hidden", openMenu.toString());

    if (open) {
      parentElement.classList.add("is-active");
      parentElement.classList.add("is-selected");
    } else {
      parentElement.classList.remove("is-active");
      parentElement.classList.remove("is-selected");
    }
  }

  function closeAllDropdowns(toggles: Array<HTMLElement>) {
    toggles.forEach(function (toggle) {
      toggleDropdown(toggle, false);
    });
  }

  function handleClickOutside(
    toggles: Array<HTMLElement>,
    containerClass: string,
  ) {
    document.addEventListener("click", function (event) {
      const target = event.target as HTMLElement;

      if (target.closest) {
        if (!target.closest(containerClass)) {
          closeAllDropdowns(toggles);
        }
      }
    });
  }

  function initNavDropdowns(containerClass: string) {
    const toggles = [].slice.call(
      document.querySelectorAll(containerClass + " [aria-controls]"),
    );

    handleClickOutside(toggles, containerClass);

    toggles.forEach(function (toggle: HTMLElement) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();

        const parentElement = toggle.parentNode as HTMLElement;
        if (parentElement.classList.contains("is-active")) {
          toggleDropdown(toggle, false);
        } else {
          closeAllDropdowns(toggles);
          toggleDropdown(toggle, true);
        }
      });
    });
  }

  window.addEventListener("DOMContentLoaded", function () {
    initNavDropdowns(".p-navigation__item--dropdown-toggle");
  });
})();

// Required to be compiled under isolatedModules
export {};
