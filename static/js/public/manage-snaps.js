import debounce from "../libs/debounce";
import { buildSnapsTableRow, getFilteredSnaps } from "./utilities";

function handleSnapsFilter(STATE) {
  const snapsFilter = document.querySelector("[data-js-snaps-filter]");
  const tableBody = document.querySelector("[data-js-snaps-table-body");

  snapsFilter.addEventListener(
    "keyup",
    debounce((e) => {
      const query = e.target.value.toLowerCase();

      tableBody.innerHTML = "";

      buildSnapsTableRow(
        getFilteredSnaps(STATE.snapsInStore, query),
        STATE.store
      );

      STATE.otherStores.forEach((otherStore) => {
        const snapsInStore = STATE.snaps.filter(
          (snap) => snap.store === otherStore.id
        );

        buildSnapsTableRow(getFilteredSnaps(snapsInStore, query), otherStore);
      });
    }),
    100
  );
}

function init(snaps, store, otherStores) {
  const STATE = {
    snaps,
    store,
    otherStores: otherStores.sort((a, b) => (a.store > b.store ? 1 : -1)),
    snapsInStore: snaps.filter((snap) => snap.store === store.id),
  };

  buildSnapsTableRow(STATE.snapsInStore, STATE.store);

  STATE.otherStores.forEach((otherStore) => {
    const snapsInStore = STATE.snaps.filter(
      (snap) => snap.store === otherStore.id
    );

    buildSnapsTableRow(snapsInStore, otherStore);
  });

  handleSnapsFilter(STATE);
}

export { init };
