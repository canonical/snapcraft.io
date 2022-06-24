// Login
var navAccountContainer = document.querySelector(".js-nav-account");

if (navAccountContainer) {
  fetch("/account.json")
    .then((response) => response.json())
    .then((data) => {
      var notAuthenticatedMenu = navAccountContainer.querySelector(
        ".js-nav-account--notauthenticated"
      );
      var authenticatedMenu = navAccountContainer.querySelector(
        ".js-nav-account--authenticated"
      );

      if (data.publisher) {
        var displayName = navAccountContainer.querySelector(
          ".js-account--name"
        );

        notAuthenticatedMenu.classList.add("u-hide");
        authenticatedMenu.classList.remove("u-hide");
        displayName.innerHTML = data.publisher["fullname"];

        if (data.publisher.stores) {
          authenticatedMenu
            .querySelector(".js-nav-account--stores")
            .classList.remove("u-hide");
        }
      } else {
        notAuthenticatedMenu.classList.remove("u-hide");
        authenticatedMenu.classList.add("u-hide");
      }
    });
}
