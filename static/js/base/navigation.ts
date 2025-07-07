// Login
const navAccountContainer = document.querySelector(".js-nav-account") as
  | HTMLElement
  | undefined;

if (navAccountContainer) {
  const notAuthenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--notauthenticated",
  )!;
  const authenticatedMenu = navAccountContainer.querySelector(
    ".js-nav-account--authenticated",
  )!;

  fetch("/account.json")
    .then(async (response) => response.json())
    .then(
      (data: {
        publisher: {
          fullname: string;
          has_stores: boolean;
          has_validation_sets: boolean;
        };
      }) => {
        if (data.publisher) {
          const displayName =
            navAccountContainer.querySelector(".js-account--name")!;

          notAuthenticatedMenu.classList.add("u-hide");
          authenticatedMenu.classList.remove("u-hide");
          displayName.innerHTML = data.publisher.fullname;
          window.sessionStorage.setItem("displayName", data.publisher.fullname);

          if (data.publisher.has_stores) {
            const storesMenu = authenticatedMenu.querySelector(
              ".js-nav-account--stores",
            )!;
            storesMenu.classList.remove("u-hide");
          }

          if (data.publisher.has_validation_sets) {
            const validationSetsMenu = authenticatedMenu.querySelector(
              ".js-nav-account--validation-sets",
            )!;
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
