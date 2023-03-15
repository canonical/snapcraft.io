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

  const allowedKeys = [
    "banner",
    "icon",
    "primary-category",
    "screenshot_urls",
    "secondary-category",
    "video_urls",
    // ========================================================
    // The following keys can be uncommented once
    // https://bugs.launchpad.net/snapstore-server/+bug/2011695
    // is resolved.
    // We are tracking this internally here:
    // https://warthogs.atlassian.net/browse/WD-2648
    // ========================================================
    // "public_metrics_blacklist",
    // "public_metrics_distros",
    // "public_metrics_enabled",
    // "public_metrics_territories",
  ];

  let showWarning = false;

  filteredDirtyFields.forEach((field) => {
    if (!allowedKeys.includes(field)) {
      showWarning = true;
    }
  });

  return showWarning;
}

export default shouldShowUpdateMetadataWarning;
