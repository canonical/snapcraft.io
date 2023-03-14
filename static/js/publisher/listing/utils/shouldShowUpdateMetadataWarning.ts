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

  const allowedKeys = ["icon", "banner", "screenshot_urls", "video_urls"];

  let showWarning = false;

  filteredDirtyFields.forEach((field) => {
    if (!allowedKeys.includes(field)) {
      showWarning = true;
    }
  });

  return showWarning;
}

export default shouldShowUpdateMetadataWarning;
