import type { ListingData } from "../types";

function getPublicMetricsTerritoriesValue(
  publicMetricsBlacklist: string[],
): boolean {
  if (publicMetricsBlacklist.length === 0) {
    return true;
  }

  if (
    publicMetricsBlacklist.length === 1 &&
    publicMetricsBlacklist.includes(
      "weekly_installed_base_by_operating_system_normalized",
    )
  ) {
    return true;
  }

  return false;
}

function getPublicMetricsDistrosValue(
  publicMetricsBlacklist: string[],
): boolean {
  if (publicMetricsBlacklist.length === 0) {
    return true;
  }

  if (
    publicMetricsBlacklist.length === 1 &&
    publicMetricsBlacklist.includes("installed_base_by_country_percent")
  ) {
    return true;
  }

  return false;
}

export default function getDefaultListingData(data: ListingData): {
  [key: string]: unknown;
} {
  return {
    banner_urls: data.banner_urls,
    contacts: data.contacts,
    description: data.description,
    donations: data.donations,
    icon_url: data.icon_url,
    issues: data.issues,
    license: data.license,
    licenses: data.licenses,
    license_type: data.license_type,
    primary_category: data.primary_category,
    primary_website: data.primary_website,
    public_metrics_distros: getPublicMetricsDistrosValue(
      data.public_metrics_blacklist,
    ),
    public_metrics_enabled: data.public_metrics_enabled,
    public_metrics_territories: getPublicMetricsTerritoriesValue(
      data.public_metrics_blacklist,
    ),
    screenshots: [
      new File([], ""),
      new File([], ""),
      new File([], ""),
      new File([], ""),
      new File([], ""),
    ],
    screenshot_urls: data.screenshot_urls,
    secondary_category: data.secondary_category,
    source_code: data.source_code,
    summary: data.summary,
    title: data.title,
    video_urls: data.video_urls,
    websites: data.websites,
  };
}
