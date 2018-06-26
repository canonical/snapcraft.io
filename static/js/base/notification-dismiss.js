(function() {
  /**
   * Find notification dismiss elements and make them interactive
   *
   * data-ispermanent will set localStorage, using data-name as the localStorages's key
   *
   * @example
   * <div class="js-notification-holder">
   *   <div class="p-notification">
   *     <p class="p-notification__response">
   *        <a href="#"
   *            class="p-notification__action"
   *            data-ispermanent="true"
   *            data-name="privacy-update-06-2018">
   *          Dismiss
   *        </a>
   *      </p>
   *    </div>
   * </div>
   */
  function dismissNotifications() {
    const links = document.querySelectorAll('.p-notification__action');

    for (let i = 0; i < links.length; i++) {
      dismissNotification(links[i]);
    }
  }

  function dismissNotification(ele) {
    const notificationHolder = ele.closest('.js-notification-holder');
    const isPermanent = ele.dataset.ispermanent;
    const name = ele.dataset.name;

    if (window.localStorage && window.localStorage.getItem(name) === 'suppress') {
      notificationHolder.parentNode.removeChild(notificationHolder);
    }

    const removeNotification = function() {
      return function (e) {
        e.preventDefault();
        if (isPermanent) {
          if (window.localStorage) {
            window.localStorage.setItem(name, 'suppress');
          }
        }
        notificationHolder.parentNode.removeChild(notificationHolder);
      };
    }();

    ele.addEventListener('click', removeNotification);
  }

  dismissNotifications();
})();