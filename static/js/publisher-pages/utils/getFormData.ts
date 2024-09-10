import getChanges from "./getChanges";

import type { SettingsData } from "../types";

function getFormData(
  settingsData: SettingsData,
  dirtyFields: { [key: string]: any },
  data: any
) {
  const changes = getChanges(dirtyFields, data);
  const formData = new FormData();

  formData.set("csrf_token", window.CSRF_TOKEN);
  formData.set("snap_id", settingsData?.snap_id);
  formData.set("private", data?.visibility);
  formData.set("territories", data?.territory_distribution_status);

  if (data?.territory_distribution_status === "custom") {
    if (dirtyFields?.whitelist_country_keys) {
      formData.set("territories_custom_type", "whitelist");
      formData.set("whitelist_countries", data?.whitelist_countries.join(","));
      formData.set("blacklist_countries", "");
    }

    if (dirtyFields?.blacklist_country_keys) {
      formData.set("territories_custom_type", "blacklist");
      formData.set("blacklist_countries", data?.blacklist_countries.join(","));
      formData.set("whitelist_countries", "");
    }

    if (!data.whitelist_country_keys && !data.blacklist_country_keys) {
      formData.set("territory_distribution_status", "all");
      formData.set("territories_custom_type", "whitelist");
      formData.set("whitelist_countries", "");
      formData.set("blacklist_countries", "");
    }
  } else {
    formData.set("territories_custom_type", "whitelist");
    formData.set("whitelist_countries", "");
    formData.set("blacklist_countries", "");
  }

  // Forcefully send the state of update_metadata_on_release in an attempt
  // to ensure it doesn't get disabled when other fields are changed.
  // This hasn't worked:
  // https://chat.canonical.com/canonical/pl/67rcgxrtmfyufr9fjd46oit87r
  changes["update_metadata_on_release"] = data?.update_metadata_on_release;

  formData.set("changes", JSON.stringify(changes));

  return formData;
}

export default getFormData;
