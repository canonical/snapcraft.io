import { arraysEqual } from "../libs/arrays";

const allowedKeys = [
  "title",
  "summary",
  "description",
  "images",
  "website",
  "contact",
  "private",
  "public_metrics_enabled",
  "public_metrics_blacklist",
  "whitelist_countries",
  "blacklist_countries",
  "video_urls",
  "license",
  "categories"
];

function commaSeperatedStringToArray(str) {
  if (
    str !== "" &&
    str
      .split(",")
      .join("")
      .trim() !== ""
  ) {
    return str.split(", ");
  } else {
    return [];
  }
}

const transform = {
  whitelist_countries: commaSeperatedStringToArray,
  blacklist_countries: commaSeperatedStringToArray,
  categories: commaSeperatedStringToArray,
  private: value => value === "private",
  public_metrics_enabled: value => value === "on"
};

function updateState(state, values) {
  if (values) {
    // if values can be iterated on (like FormData)
    if (values.forEach) {
      values.forEach((value, key) => {
        if (allowedKeys.includes(key)) {
          // FormData values encode new lines as \r\n which are invalid for our API
          // so we need to replace them back to \n
          let newValue = value.replace(/\r\n/g, "\n");

          // Some values will need to be transformed in some way for the API
          if (transform[key]) {
            newValue = transform[key](newValue);
          }

          state[key] = newValue;
        }
      });
      // else if it's just a plain object
    } else {
      for (let key in values) {
        if (allowedKeys.includes(key)) {
          state[key] = values[key];
        }
      }
    }
  }
}

function diffState(initialState, state) {
  const diff = {};

  for (let key of allowedKeys) {
    // images is an array of objects so compare stringified version
    if (key === "images" && state[key]) {
      const images = state[key]
        // remove images to delete from the diff
        .filter(image => image.status !== "delete")
        // ignore selected status when comparing
        .map(image => {
          delete image.selected;
          return image;
        });

      if (JSON.stringify(initialState[key]) !== JSON.stringify(images)) {
        diff[key] = images;
      }
    } else {
      if (initialState[key] !== state[key]) {
        if (Array.isArray(initialState[key]) && Array.isArray(state[key])) {
          if (!arraysEqual(initialState[key], state[key])) {
            diff[key] = state[key];
          }
        } else {
          diff[key] = state[key];
        }
      }
    }
  }

  // only return diff when there are any changes
  return Object.keys(diff).length > 0 ? diff : null;
}

export { updateState, diffState };
