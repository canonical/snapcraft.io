import { FieldValues } from "react-hook-form";

function getCountryKeysStatus(settingsData: FieldValues) {
  if (settingsData?.blacklist_country_keys) {
    return "exclude";
  }

  return "include";
}

function getTerritoryDistributionStatus(data: FieldValues) {
  if (
    data?.whitelist_countries.length > 0 ||
    data?.blacklist_countries.length > 0
  ) {
    return "custom";
  } else {
    return "all";
  }
}

function getVisibilityStatus(data: FieldValues) {
  if (data?.unlisted) {
    return "unlisted";
  }

  if (data?.private) {
    return "private";
  }

  return "public";
}

function getSettingsData(settingsData: FieldValues) {
  settingsData.visibility = getVisibilityStatus(settingsData);
  settingsData.territory_distribution_status =
    getTerritoryDistributionStatus(settingsData);
  settingsData.whitelist_country_keys = settingsData?.whitelist_countries
    .sort()
    .join(" ");
  settingsData.blacklist_country_keys = settingsData?.blacklist_countries
    .sort()
    .join(" ");
  settingsData.country_keys_status = getCountryKeysStatus(settingsData);

  return settingsData;
}

export default getSettingsData;
