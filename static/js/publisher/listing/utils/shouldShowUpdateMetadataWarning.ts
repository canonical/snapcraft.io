interface DirtyField {
  [key: string]: any;
}

function shouldShowUpdateMetadataWarning(dirtyFields: DirtyField) {
  const filteredDirtyFields = [];

  for (const [key, value] of Object.entries(dirtyFields)) {
    if (value === true && key !== "banner_url" && key !== "icon_url") {
      filteredDirtyFields.push(key);
    }

    if (
      key === "banner_url" &&
      value === true &&
      !filteredDirtyFields.includes("banner") &&
      !filteredDirtyFields.includes("screenshot_urls")
    ) {
      filteredDirtyFields.push("banner");
    }

    if (
      key === "icon_url" &&
      value === true &&
      !filteredDirtyFields.includes("icon")
    ) {
      filteredDirtyFields.push("icon");
    }

    if (key === "screenshot_urls" && value.includes(true)) {
      filteredDirtyFields.push("screenshot_urls");
    }
  }

  if (filteredDirtyFields.length === 1) {
    if (
      filteredDirtyFields.includes("icon") ||
      filteredDirtyFields.includes("banner") ||
      filteredDirtyFields.includes("screenshot_urls")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 2) {
    if (
      filteredDirtyFields.includes("icon") &&
      filteredDirtyFields.includes("banner")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("icon") &&
      filteredDirtyFields.includes("screenshot_urls")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 3) {
    if (
      filteredDirtyFields.includes("icon") &&
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls")
    ) {
      return false;
    }
  }

  return true;
}

export default shouldShowUpdateMetadataWarning;
