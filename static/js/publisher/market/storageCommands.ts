function storageCommands(
  e: StorageEvent,
  formEl: HTMLFormElement,
  snap_name: string,
  ignoreChangesOnUnload: Function,
  context = window
) {
  const key = `${snap_name}-command`;
  if (e.key === key) {
    context.localStorage.removeItem(key);
    switch (e.newValue) {
      case "edit":
        context.focus();
        break;
      case "revert":
        ignoreChangesOnUnload();
        context.location.reload();
        break;
      case "save":
        formEl.dispatchEvent(new Event("submit"));
        break;
    }
  }

  return;
}

export { storageCommands };
