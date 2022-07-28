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
