import "@testing-library/jest-dom";

import getSettingsFormData from "../getSettingsFormData";

const settingsData = {
  blacklist_countries: [],
  blacklist_country_keys: "",
  countries: [],
  country_keys_status: null,
  private: true,
  publisher_name: "John Doe",
  snap_id: "snap-id",
  snap_name: "Test snap name",
  snap_title: "Test snap title",
  status: "published",
  store: "Global",
  territory_distribution_status: "custom",
  unlisted: false,
  update_metadata_on_release: false,
  visibility: "private",
  visibility_locked: false,
  whitelist_countries: ["GB"],
  whitelist_country_keys: "",
};

const data = {
  blacklist_countries: [],
  blacklist_country_keys: "",
  countries: [],
  country_keys_status: null,
  private: false,
  publisher_name: "John Doe",
  snap_id: "snap-id",
  snap_name: "Test snap name",
  snap_title: "Test snap title",
  status: "published",
  store: "Global",
  territory_distribution_status: "custom",
  unlisted: true,
  update_metadata_on_release: false,
  visibility: "private",
  visibility_locked: false,
  whitelist_countries: ["GB"],
  whitelist_country_keys: "",
};

describe("getSettingsFormData", () => {
  test("gets correct formData", () => {
    const formData = getSettingsFormData(
      settingsData,
      {
        private: true,
        territory_distribution_status: true,
        unlisted: true,
        visibility: true,
        whitelist_country_keys: true,
      },
      data,
    );

    expect(formData.get("snap_id")).toEqual("snap-id");
    expect(formData.get("private")).toEqual("private");
    expect(formData.get("territories")).toEqual("custom");
    expect(formData.get("territories_custom_type")).toEqual("whitelist");
    expect(formData.get("blacklist_countries")).toEqual("");
  });
});
