function formatSelectedSnapData(snapCheckboxes) {
  let snaps = [];

  snapCheckboxes.forEach((snap) => {
    snaps.push({
      name: snap.dataset.snapName,
    });
  });

  return snaps;
}

function updateSnaps() {
  const manageSnapsForm = document.querySelector("#manage-snaps-form");
  const saveButton = document.querySelector(".js-save-button");
  const snapsTable = document.querySelector("#snaps-table");
  const snapCheckboxes = Array.prototype.slice.call(
    snapsTable.querySelectorAll(":checked")
  );

  const originalSnapState = formatSelectedSnapData(snapCheckboxes);
  let currentSnaps = originalSnapState;
  let dirtyData = false;

  snapCheckboxes.forEach((snap) => {
    snap.addEventListener("change", () => {
      const currentSnapCheckboxes = Array.prototype.slice.call(
        snapsTable.querySelectorAll(":checked")
      );

      currentSnaps = formatSelectedSnapData(currentSnapCheckboxes);

      if (
        JSON.stringify(originalSnapState.sort()) !==
        JSON.stringify(currentSnaps.sort())
      ) {
        dirtyData = true;
      } else {
        dirtyData = false;
      }

      saveButton.disabled = !dirtyData;
    });
  });

  manageSnapsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.target;
    const updateSnapsField = form.querySelector("#snaps");

    updateSnapsField.value = JSON.stringify({
      add: [],
      remove: [],
    });

    form.submit();
  });
}

export { updateSnaps };
