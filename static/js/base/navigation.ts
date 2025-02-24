// Login
const navAccountContainer = document.querySelector(
  ".js-nav-account",
) as HTMLElement;

if (navAccountContainer) {
  const notAuthenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--notauthenticated",
  ) as HTMLElement;
  const authenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--authenticated",
  ) as HTMLElement;

  fetch("/account.json")
    .then((response) => response.json())
    .then(
      (data: {
        publisher: {
          fullname: string;
          has_stores: boolean;
          has_validation_sets: boolean;
        };
      }) => {
        if (data.publisher) {
          const displayName = navAccountContainer.querySelector(
            ".js-account--name",
          ) as HTMLElement;

          notAuthenticatedMenu.classList.add("u-hide");
          authenticatedMenu.classList.remove("u-hide");
          displayName.innerHTML = data.publisher["fullname"];
          if (window.sessionStorage) {
            window.sessionStorage.setItem(
              "displayName",
              data.publisher["fullname"],
            );
          }

          if (data.publisher.has_stores) {
            const storesMenu = authenticatedMenu.querySelector(
              ".js-nav-account--stores",
            ) as HTMLElement;
            storesMenu.classList.remove("u-hide");
          }

          if (data.publisher.has_validation_sets) {
            const validationSetsMenu = authenticatedMenu.querySelector(
              ".js-nav-account--validation-sets",
            ) as HTMLElement;
            validationSetsMenu.classList.remove("u-hide");
          }
        } else {
          notAuthenticatedMenu.classList.remove("u-hide");
          authenticatedMenu.classList.add("u-hide");
        }
      },
    )
    .catch(() => {
      notAuthenticatedMenu.classList.remove("u-hide");
      authenticatedMenu.classList.add("u-hide");
    });
}
