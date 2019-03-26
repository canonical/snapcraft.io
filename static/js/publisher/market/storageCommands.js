function storageCommands(
  e,
  formEl,
  snap_name,
  ignoreChangesOnUnload,
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
        context.location.reload(true);
        break;
      case "save":
        formEl.dispatchEvent(new Event("submit"));
        break;
    }
  }

  return;
}

export { storageCommands };
