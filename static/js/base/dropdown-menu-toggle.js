(function () {
  function toggleDropdown(toggle, open) {
    var parentElement = toggle.parentNode;
    var dropdown = document.getElementById(
      toggle.getAttribute("aria-controls")
    );
    dropdown.setAttribute("aria-hidden", !open);

    if (open) {
      parentElement.classList.add("is-active");
      parentElement.classList.add("is-selected");
    } else {
      parentElement.classList.remove("is-active");
      parentElement.classList.remove("is-selected");
    }
  }

  function closeAllDropdowns(toggles) {
    toggles.forEach(function (toggle) {
      toggleDropdown(toggle, false);
    });
  }

  function handleClickOutside(toggles, containerClass) {
    document.addEventListener("click", function (event) {
      var target = event.target;

      if (target.closest) {
        if (!target.closest(containerClass)) {
          closeAllDropdowns(toggles);
        }
      } else if (target.msMatchesSelector) {
        // IE friendly `Element.closest` equivalent
        // as in https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
        do {
          if (target.msMatchesSelector(containerClass)) {
            return;
          }
          target = target.parentElement || target.parentNode;
        } while (target !== null && target.nodeType === 1);

        closeAllDropdowns(toggles);
      }
    });
  }

  function initNavDropdowns(containerClass) {
    var toggles = [].slice.call(
      document.querySelectorAll(containerClass + " [aria-controls]")
    );

    handleClickOutside(toggles, containerClass);

    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();

        var parentElement = toggle.parentNode;
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
