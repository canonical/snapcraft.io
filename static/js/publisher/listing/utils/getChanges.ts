const formatImageChanges = (
  bannerUrl: [string],
  iconUrl: string,
  screenshotUrls: [string],
  screenshots: [FileList]
) => {
  const images = [];

  if (bannerUrl) {
    images.push({
      url: bannerUrl,
      type: "banner",
      status: "uploaded",
    });
  }

  if (iconUrl) {
    images.push({
      url: iconUrl,
      type: "icon",
      status: "uploaded",
    });
  }

  if (screenshotUrls.length) {
    screenshotUrls.forEach((url) => {
      images.push({
        url,
        type: "screenshot",
        status: "uploaded",
      });
    });
  }

  if (screenshots) {
    screenshots.forEach((screenshot) => {
      if (screenshot[0]) {
        images.push({
          url: URL.createObjectURL(screenshot[0]),
          type: "screenshot",
          status: "new",
          name: screenshot[0].name,
        });
      }
    });
  }

  return images;
};

function getChanges(
  dirtyFields: { [key: string]: any },
  data: { [key: string]: any }
) {
  const changes: { [key: string]: any } = {};
  const keys = Object.keys(dirtyFields);
  const forbiddenKeys = [
    "primary-category",
    "secondary-category",
    "contacts",
    "donations",
    "issues",
    "source-code",
    "websites",
    "licenses",
  ];

  const removeEmptyUrls = (urls: Array<{ url: string }>) => {
    return urls.filter((url) => url.url !== "");
  };

  if (
    dirtyFields.contacts ||
    dirtyFields.donations ||
    dirtyFields.issues ||
    dirtyFields.license ||
    dirtyFields["source-code"] ||
    dirtyFields.website
  ) {
    changes.links = {
      contact: data.contacts
        ? removeEmptyUrls(data.contacts).map((url: { url: string }) => url.url)
        : [],
      donations: data.donations
        ? removeEmptyUrls(data.donations).map((url: { url: string }) => url.url)
        : [],
      issues: data.issues
        ? removeEmptyUrls(data.issues).map((url: { url: string }) => url.url)
        : [],
      website: data.websites
        ? removeEmptyUrls(data.websites).map((url: { url: string }) => url.url)
        : [],
      source: data["source-code"]
        ? removeEmptyUrls(data["source-code"]).map(
            (url: { url: string }) => url.url
          )
        : [],
    };
  }

  if (
    dirtyFields.banner_url ||
    dirtyFields.icon_url ||
    dirtyFields.screenshot_urls ||
    dirtyFields.icon ||
    dirtyFields.banner ||
    dirtyFields.screenshots
  ) {
    changes.images = formatImageChanges(
      data?.banner_url,
      data?.icon_url,
      data?.screenshot_urls,
      data?.screenshots
    );
  }

  keys.forEach((key) => {
    if (!forbiddenKeys.includes(key) && dirtyFields[key] === true) {
      changes[key] = data[key];
    }

    if (dirtyFields["primary-category"] || dirtyFields["secondary-category"]) {
      changes.categories = [];

      if (data["primary-category"]) {
        changes.categories.push(data["primary-category"]);
      }

      if (data["secondary-category"]) {
        changes.categories.push(data["secondary-category"]);
      }
    }
  });

  return changes;
}

export default getChanges;
