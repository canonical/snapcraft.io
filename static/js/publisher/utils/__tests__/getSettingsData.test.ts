import getSettingsData from "../getSettingsData";

const testSettingsData = {
  whitelist_countries: [],
  blacklist_countries: [],
};

describe("getSettingsData", () => {
  test("gets unlisted visibility status", () => {
    const settings = getSettingsData({ ...testSettingsData, unlisted: true });
    expect(settings.visibility).toEqual("unlisted");
  });

  test("gets private visibility status", () => {
    const settings = getSettingsData({ ...testSettingsData, private: true });
    expect(settings.visibility).toEqual("private");
  });

  test("gets public visibility status", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      unlisted: false,
      private: false,
    });

    expect(settings.visibility).toEqual("public");
  });

  test("gets custom territory distribution status if whitelist", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      whitelist_countries: ["EN"],
    });

    expect(settings.territory_distribution_status).toEqual("custom");
  });

  test("gets custom territory distribution status if blacklist", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      blacklist_countries: ["EN"],
    });

    expect(settings.territory_distribution_status).toEqual("custom");
  });

  test("gets all territory distrubtion status", () => {
    const settings = getSettingsData(testSettingsData);
    expect(settings.territory_distribution_status).toEqual("all");
  });

  test("gets whitelist country keys", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      whitelist_countries: ["US", "EN"],
    });

    expect(settings.whitelist_country_keys).toEqual("EN US");
  });

  test("gets blacklist country keys", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      blacklist_countries: ["US", "EN"],
    });

    expect(settings.blacklist_country_keys).toEqual("EN US");
  });

  test("gets country keys status if blacklist country keys", () => {
    const settings = getSettingsData({
      ...testSettingsData,
      blacklist_countries: ["EN", "US"],
    });

    expect(settings.country_keys_status).toEqual("exclude");
  });

  test("gets country keys status", () => {
    const settings = getSettingsData(testSettingsData);
    expect(settings.country_keys_status).toEqual("include");
  });
});
