interface DirtyField {
  [key: string]: any;
}

function shouldShowUpdateMetadataWarning(dirtyFields: DirtyField) {
  const filteredDirtyFields = [];

  for (const [key, value] of Object.entries(dirtyFields)) {
    if (
      value === true &&
      key !== "banner_url" &&
      key !== "video_urls" &&
      key !== "primary-category" &&
      key !== "secondary-category"
    ) {
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

    if (key === "screenshot_urls" && value.includes(true)) {
      filteredDirtyFields.push("screenshot_urls");
    }

    if (key === "video_urls" && value === true) {
      filteredDirtyFields.push("video_urls");
    }

    if (key === "primary-category" && value === true) {
      filteredDirtyFields.push("primary-category");
    }

    if (key === "secondary-category" && value === true) {
      filteredDirtyFields.push("secondary-category");
    }
  }

  if (filteredDirtyFields.length === 1) {
    if (
      filteredDirtyFields.includes("banner") ||
      filteredDirtyFields.includes("screenshot_urls") ||
      filteredDirtyFields.includes("video_urls") ||
      filteredDirtyFields.includes("primary-category") ||
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 2) {
    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("video_urls")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("primary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 3) {
    if (
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("video_urls")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 4) {
    if (
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }

    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category")
    ) {
      return false;
    }
  }

  if (filteredDirtyFields.length === 5) {
    if (
      filteredDirtyFields.includes("banner") &&
      filteredDirtyFields.includes("screenshot_urls") &&
      filteredDirtyFields.includes("video_urls") &&
      filteredDirtyFields.includes("primary-category") &&
      filteredDirtyFields.includes("secondary-category")
    ) {
      return false;
    }
  }

  return true;
}

export default shouldShowUpdateMetadataWarning;
