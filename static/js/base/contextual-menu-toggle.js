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
      toggles[i].addEventListener('click', function(evt) {
        evt.preventDefault();
        var targetMenu = document.getElementById(this.getAttribute('aria-controls'));

        if (targetMenu) {
          if (targetMenu.getAttribute('aria-hidden') === 'true') {
            this.setAttribute('aria-expanded', true);
            targetMenu.setAttribute('aria-hidden', false);
          } else {
            this.setAttribute('aria-expanded', false);
            targetMenu.setAttribute('aria-hidden', true);
          }
        }
      });
    }
  }

  toggle('.p-contextual-menu__toggle');
})();
