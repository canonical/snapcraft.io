// Login
var navAccountContainer = document.querySelector(".js-nav-account");

if (navAccountContainer) {
  fetch("/account.json")
    .then((response) => response.json())
    .then((data) => {
      if (data.publisher) {
        var notAuthenticatedMenu = navAccountContainer.querySelector(
          ".js-nav-account--notauthenticated"
        );
        var authenticatedMenu = navAccountContainer.querySelector(
          ".js-nav-account--authenticated"
        );
        var displayName =
          navAccountContainer.querySelector(".js-account--name");

        navAccountContainer.classList.add(
          "p-subnav",
          "p-navigation__item--dropdown-toggle"
        );
        notAuthenticatedMenu.classList.add("u-hide");
        authenticatedMenu.classList.remove("u-hide");
        displayName.innerHTML = data.publisher["fullname"];
      }
    });
}