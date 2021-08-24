import debounce from "../libs/debounce";

function init(stores) {
  const searchInput = document.querySelector(".js-store-search-input");
  const storeList = document.querySelector(".js-store-list");
  const originalStoreList = storeList.cloneNode(true).innerHTML;
  const storeListItemTemplate = document.querySelector(
    "#store-list-item-template"
  );

  searchInput.addEventListener(
    "keyup",
    debounce((e) => {
      const query = e.target.value.toLowerCase();
      let filteredStores = stores;

      storeList.innerHTML = "";

      filteredStores = stores.filter((store) => {
        return store.name.toLowerCase().includes(query);
      });

      if (query) {
        filteredStores.forEach((store) => {
          const clone = storeListItemTemplate.content.cloneNode(true);
          const storeLink = clone.querySelector(".p-side-navigation__link");
          const storeLinkIcon = clone.querySelector(".p-side-navigation__icon");
          const storeLinkLabel = clone.querySelector(
            ".p-side-navigation__label"
          );

          storeLink.setAttribute("href", `/admin/${store.id}/snaps`);
          storeLinkIcon.innerText = store.name.charAt(0);
          storeLinkLabel.innerText = store.name;

          storeList.appendChild(clone);
        });
      } else {
        storeList.innerHTML = originalStoreList;
      }
    }),
    100
  );
}

export { init };
