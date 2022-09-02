import getChanges from "./getChanges";

import type { SettingsData } from "../types/SettingsData";

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

  if (changes?.update_metadata_on_release === "on") {
    formData.set("update_metadata_on_release", "on");
  }

  formData.set("changes", JSON.stringify(changes));

  return formData;
}

export default getFormData;
