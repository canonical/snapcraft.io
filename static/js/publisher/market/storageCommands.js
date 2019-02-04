function storageCommands(
  e,
  formEl,
  snap_name,
  ignoreChangesOnUnload,
  context = window
) {
  const key = `${snap_name}-command`;
  if (e.key === key) {
    switch (e.newValue) {
      case "edit":
        context.localStorage.removeItem(key);
        context.focus();
        break;
      case "revert":
        context.localStorage.removeItem(key);
        ignoreChangesOnUnload();
        context.location.reload(true);
        break;
      case "save":
        context.localStorage.removeItem(key);
        formEl.dispatchEvent(new Event("submit"));
        break;
    }
  }
  return;
}

export { storageCommands };
