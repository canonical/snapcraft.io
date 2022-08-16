const formatImageChanges = (
  bannerUrl: [string],
  iconUrl: string,
  screenshotUrls: [string]
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

  if (
    dirtyFields.contacts ||
    dirtyFields.donations ||
    dirtyFields.issues ||
    dirtyFields.license ||
    dirtyFields["source-code"] ||
    dirtyFields.website
  ) {
    changes.links = {
      contact: data?.contacts,
      donation: data?.donations,
      issues: data?.issues,
      license: data?.license,
      "source-code": data?.["source-code"],
      website: data?.websites,
    };
  }

  if (
    dirtyFields.banner_url ||
    dirtyFields.icon_url ||
    dirtyFields.screenshot_urls ||
    dirtyFields.icon ||
    dirtyFields.banner
  ) {
    changes.images = formatImageChanges(
      data?.banner_url,
      data?.icon_url,
      data?.screenshot_urls
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
