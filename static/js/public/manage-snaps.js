import buildSnapsTableRow from "./build-snaps-table-row";

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
}

export { init };
