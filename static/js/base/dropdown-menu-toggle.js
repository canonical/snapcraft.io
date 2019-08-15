(function() {
  /**
   * Toggle target elements with aria controls, hidden and expanded.
   *
   * @param {String} toggleCtrl A css selector to use as the control.
   *
   * @example
   * <button class="p-contextual-menu__toggle" aria-controls="#menu" aria-expanded="false">Toggle</button>
   * <div id="menu" aria-hidden="true">
   *  <p>Example menu</p>
   * </div>
   *
   */
  function toggle(toggleCtrl) {
    var toggles = document.querySelectorAll(toggleCtrl);

    for (var i = 0, ii = toggles.length; i < ii; i += 1) {
      toggles[i].addEventListener("click", function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        toggleDropdown(this, this.getAttribute("aria-expanded") === "false");
      });
    }

    document.body.addEventListener("click", function() {
      for (var i = 0, ii = toggles.length; i < ii; i += 1) {
        toggles[i].setAttribute("aria-expanded", false);

        toggleDropdown(toggles[i], false);
      }
    });
  }

  // helper function to toggle dropdown
  function toggleDropdown(toggle, show) {
    var targetMenu = document.getElementById(
      toggle.getAttribute("aria-controls")
    );
    var parentMenu = toggle.closest(".p-subnav");

    if (targetMenu) {
      if (show) {
        toggle.setAttribute("aria-expanded", true);
        targetMenu.setAttribute("aria-hidden", false);
        if (parentMenu) {
          parentMenu.classList.add("is-active");
        }
      } else {
        toggle.setAttribute("aria-expanded", false);
        targetMenu.setAttribute("aria-hidden", true);
        if (parentMenu) {
          parentMenu.classList.remove("is-active");
        }
      }
    }
  }

  toggle(".p-subnav__toggle");
})();
