import getSettingsChanges from "../getSettingsChanges";

describe("getSettingsChanges", () => {
  test("handles setting visibility to public", () => {
    const changes = getSettingsChanges(
      { visibility: true },
      { visibility: "public" },
    );

    expect(changes.private).toEqual(false);
    expect(changes.unlisted).toEqual(false);
  });

  test("handles setting visibility to unlisted", () => {
    const changes = getSettingsChanges(
      { visibility: true },
      { visibility: "unlisted" },
    );

    expect(changes.unlisted).toEqual(true);
    expect(changes.private).toEqual(false);
  });

  test("handles setting visibility to private", () => {
    const changes = getSettingsChanges(
      { visibility: true },
      { visibility: "private" },
    );

    expect(changes.private).toEqual(true);
    expect(changes.unlisted).toEqual(false);
  });

  test("handles setting territories to all", () => {
    const changes = getSettingsChanges(
      { territory_distribution_status: true },
      { territory_distribution_status: "all" },
    );

    expect(changes.whitelist_countries).toHaveLength(0);
    expect(changes.blacklist_countries).toHaveLength(0);
  });

  test("handles removing custom whitelist countries", () => {
    const changes = getSettingsChanges(
      { whitelist_country_keys: true },
      { territory_distribution_status: "custom" },
    );

    expect(changes.whitelist_countries).toHaveLength(0);
    expect(changes.blacklist_countries).toHaveLength(0);
  });

  test("handles setting custom whitelist countries", () => {
    const changes = getSettingsChanges(
      { whitelist_country_keys: true },
      {
        territory_distribution_status: "custom",
        whitelist_country_keys: "EN US FR",
      },
    );

    expect(changes.whitelist_countries).toEqual(["EN", "US", "FR"]);
    expect(changes.blacklist_countries).toHaveLength(0);
  });

  test("handles removing custom blacklist countries", () => {
    const changes = getSettingsChanges(
      { blacklist_country_keys: true },
      { territory_distribution_status: "custom" },
    );

    expect(changes.blacklist_countries).toHaveLength(0);
    expect(changes.whitelist_countries).toHaveLength(0);
  });

  test("handles setting custom blacklist countries", () => {
    const changes = getSettingsChanges(
      { blacklist_country_keys: true },
      {
        territory_distribution_status: "custom",
        blacklist_country_keys: "EN US FR",
      },
    );

    expect(changes.blacklist_countries).toEqual(["EN", "US", "FR"]);
    expect(changes.whitelist_countries).toHaveLength(0);
  });

  test("handles enabling update metadata on release", () => {
    const changes = getSettingsChanges(
      { update_metadata_on_release: true },
      { update_metadata_on_release: true },
    );

    expect(changes.update_metadata_on_release).toEqual("on");
  });

  test("handles disabling update metadata on release", () => {
    const changes = getSettingsChanges(
      { update_metadata_on_release: true },
      { update_metadata_on_release: false },
    );

    expect(changes.update_metadata_on_release).toEqual(false);
  });
});
