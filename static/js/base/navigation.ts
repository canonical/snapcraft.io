// Login
var navAccountContainer = document.querySelector(
  ".js-nav-account"
) as HTMLElement;

if (navAccountContainer) {
  var notAuthenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--notauthenticated"
  ) as HTMLElement;
  var authenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--authenticated"
  ) as HTMLElement;

  fetch("/account.json")
    .then((response) => response.json())
    .then((data: { publisher: { fullname: string; has_stores: boolean } }) => {
      if (data.publisher) {
        var displayName = navAccountContainer.querySelector(
          ".js-account--name"
        ) as HTMLElement;

        notAuthenticatedMenu.classList.add("u-hide");
        authenticatedMenu.classList.remove("u-hide");
        displayName.innerHTML = data.publisher["fullname"];
        if (window.sessionStorage) {
          window.sessionStorage.setItem(
            "displayName",
            data.publisher["fullname"]
          );
        }

        if (data.publisher.has_stores) {
          const storesMenu = authenticatedMenu.querySelector(
            ".js-nav-account--stores"
          ) as HTMLElement;
          storesMenu.classList.remove("u-hide");
        }
      } else {
        notAuthenticatedMenu.classList.remove("u-hide");
        authenticatedMenu.classList.add("u-hide");
      }
    })
    .catch(() => {
      notAuthenticatedMenu.classList.remove("u-hide");
      authenticatedMenu.classList.add("u-hide");
    });
}
