import { FieldValues } from "react-hook-form";

function getSettingsChanges(
  dirtyFields: { [key: string]: unknown },
  data: FieldValues,
) {
  const changes: { [key: string]: unknown } = {};

  if (dirtyFields?.visibility) {
    if (data?.visibility === "public") {
      changes.private = false;
      changes.unlisted = false;
    }

    if (data?.visibility === "unlisted") {
      changes.unlisted = true;
      changes.private = false;
    }

    if (data?.visibility === "private") {
      changes.private = true;
      changes.unlisted = false;
    }
  }

  if (dirtyFields?.territory_distribution_status) {
    if (data?.territory_distribution_status === "all") {
      changes.whitelist_countries = [];
      changes.blacklist_countries = [];
    }
  }

  if (data?.territory_distribution_status === "custom") {
    if (dirtyFields?.whitelist_country_keys) {
      if (
        !data?.whitelist_country_keys ||
        !data?.whitelist_country_keys.length
      ) {
        changes.whitelist_countries = [];
      } else {
        changes.whitelist_countries = data?.whitelist_country_keys.split(" ");
      }

      changes.blacklist_countries = [];
    }

    if (dirtyFields?.blacklist_country_keys) {
      if (
        !data?.blacklist_country_keys ||
        !data?.blacklist_country_keys.length
      ) {
        changes.blacklist_countries = [];
      } else {
        changes.blacklist_countries = data?.blacklist_country_keys.split(" ");
      }

      changes.whitelist_countries = [];
    }
  }

  if (dirtyFields?.update_metadata_on_release) {
    if (data?.update_metadata_on_release) {
      changes.update_metadata_on_release = "on";
    } else {
      changes.update_metadata_on_release = false;
    }
  }

  return changes;
}

export default getSettingsChanges;
