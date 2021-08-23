import autoComplete from "@tarekraafat/autocomplete.js";

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
        STATE.store,
        STATE.store
      );

      STATE.otherStores.forEach((otherStore) => {
        const snapsInStore = STATE.snaps.filter(
          (snap) => snap.store === otherStore.id
        );

        buildSnapsTableRow(
          getFilteredSnaps(snapsInStore, query),
          otherStore,
          STATE.store
        );
      });
    }),
    100
  );
}

function handleSnapsSearch(STATE) {
  const searchField = document.querySelector("#autoComplete");

  // eslint-disable-next-line
  const autoCompleteJS = new autoComplete({
    data: {
      src: async () => {
        const source = await fetch(
          `/admin/${STATE.store.id}/snaps/search.json?q=${searchField.value}&allowed_for_inclusion=${STATE.store.id}`
        );

        const data = await source.json();

        return data.filter((d) => {
          const snap = STATE.snaps.find((s) => s.id === d.id);
          return !snap;
        });
      },
      key: ["name"],
      trigger: {
        event: ["input", "focus"],
      },
    },
    onSelection: (selection) => {
      const selected = selection.selection.value;

      if (!STATE.snapsToInclude.find((snap) => snap.name === selected.name)) {
        STATE.snapsToInclude.push(selected);
        updateSnapsToInclude(STATE.snapsToInclude, STATE);
      }

      searchField.value = "";
    },
    resultItem: {
      content: (data, element) => {
        const subContent = document.createElement("div");
        const owner = data.value.users.find((user) =>
          user.roles.includes("owner")
        );
        const subContentInner = `
          <small class="u-text-muted">${owner.displayname}</small>
          <small class="u-text-muted">|</small>
          <small class="u-text-muted">${data.value.store}</small>
        `;
        subContent.innerHTML = subContentInner;
        element.appendChild(subContent);
      },
    },
  });
}

function removeSnapToInclude(el, snaps, STATE) {
  const snapName = el.closest("button").dataset.jsRemoveSnap;
  const newSnaps = snaps.filter((snap) => snap.name !== snapName);

  STATE.snapsToInclude = newSnaps;
  updateSnapsToInclude(newSnaps, STATE);
}

function updateSnapsToInclude(snaps, STATE) {
  const snapsToAddList = document.querySelector("[data-js-snaps-to-add]");
  const template = document.querySelector("[data-js-snap-to-add]");

  snapsToAddList.innerHTML = "";

  snaps.forEach((snap) => {
    const clone = template.content.cloneNode(true);
    const snapNameContainer = clone.querySelector("[data-js-snap-name]");
    const snapStoreContainer = clone.querySelector("[data-js-snap-store]");
    const snapOwnerContainer = clone.querySelector("[data-js-snap-owner]");
    const removeSnapButton = clone.querySelector("[data-js-remove-snap]");

    const snapOwner = snap.users.find((user) => user.roles.includes("owner"));

    snapNameContainer.innerText = snap.name;
    snapStoreContainer.innerText = snap.store;
    snapOwnerContainer.innerText = snapOwner.displayname;
    removeSnapButton.dataset.jsRemoveSnap = snap.name;
    removeSnapButton.addEventListener("click", (event) => {
      removeSnapToInclude(event.target, snaps, STATE);
    });

    snapsToAddList.appendChild(clone);
  });

  if (snaps.length) {
    setSubmitDisabledState(false);
  } else {
    setSubmitDisabledState(true);
  }

  handleAddSnapsForm(snaps);
}

function handleAddSnapsForm(snaps) {
  const addSnapsForm = document.querySelector("[data-js-add-snaps-form]");

  addSnapsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.target;
    const snapsField = form.querySelector("#snaps");
    const snapsData = {
      add: snaps.map((snap) => {
        return {
          name: snap.name,
        };
      }),
    };

    snapsField.value = JSON.stringify(snapsData);
    form.submit();
  });
}

function setSubmitDisabledState(disabled) {
  const addSnapsButton = document.querySelector("[data-js-add-snaps-button]");
  addSnapsButton.disabled = disabled;
}

function init(snaps, store, otherStores, isAdmin) {
  const STATE = {
    snaps,
    store,
    otherStores: otherStores.sort((a, b) => (a.store > b.store ? 1 : -1)),
    snapsInStore: snaps.filter((snap) => snap.store === store.id),
    snapsToInclude: [],
  };

  buildSnapsTableRow(STATE.snapsInStore, STATE.store, STATE.store);

  STATE.otherStores.forEach((otherStore) => {
    const snapsInStore = STATE.snaps.filter(
      (snap) => snap.store === otherStore.id
    );

    buildSnapsTableRow(snapsInStore, otherStore, STATE.store);
  });

  handleSnapsFilter(STATE);

  if (isAdmin) {
    handleSnapsSearch(STATE);
  }
}

export { init };
