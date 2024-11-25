import { FieldValues } from "react-hook-form";

import formatImageChanges from "./formatImageChanges";

type Changes = {
  [key: string]: unknown;
  categories?: string[] | undefined;
  images?: {
    name?: string;
    url: string;
    status: string;
  }[];
  links?: {
    contact: string[];
    donations: string[];
    issues: string[];
    source: string[];
    website: string[];
  };
  public_metrics_blacklist?: string[];
};

export default function getListingChanges(
  dirtyFields: { [key: string]: boolean },
  fieldValues: FieldValues,
  data: {
    banner_urls: string[];
  },
): Changes {
  const changes: Changes = {};

  if (
    dirtyFields.banner_urls ||
    dirtyFields.icon_url ||
    dirtyFields.screenshot_urls ||
    dirtyFields.icon ||
    dirtyFields.banner ||
    dirtyFields.screenshots
  ) {
    changes.images = formatImageChanges(
      data.banner_urls,
      fieldValues.icon_url,
      fieldValues.screenshot_urls,
      fieldValues.screenshots,
      dirtyFields,
    );
  }

  const forbiddenKeys = [
    "primary_category",
    "secondary_category",
    "websites",
    "contacts",
    "donations",
    "source_code",
    "issues",
    "icon",
    "icon_url",
  ];

  const linksKeys = [
    "websites",
    "contacts",
    "donations",
    "source_code",
    "issues",
    "primary_website",
  ];

  const getUrls = (item: { url: string }) => item.url;

  for (const [key, value] of Object.entries(dirtyFields)) {
    if (!forbiddenKeys.includes(key) && value !== false) {
      changes[key] = fieldValues[key];
    }

    if (linksKeys.includes(key)) {
      changes.links = {
        contact: fieldValues.contacts.map(getUrls),
        donations: fieldValues.donations.map(getUrls),
        issues: fieldValues.issues.map(getUrls),
        source: fieldValues.source_code.map(getUrls),
        website: fieldValues.websites.map(getUrls),
      };

      if (fieldValues.primary_website) {
        changes.links.website.unshift(fieldValues.primary_website);
      }
    }
  }

  if (dirtyFields.primary_category || dirtyFields.secondary_category) {
    const categories = [];

    if (fieldValues.primary_category) {
      categories.push(fieldValues.primary_category);
    }

    if (fieldValues.secondary_category) {
      categories.push(fieldValues.secondary_category);
    }

    changes.categories = categories;
  }

  if (
    dirtyFields.public_metrics_territories ||
    dirtyFields.public_metrics_distros
  ) {
    if (fieldValues.public_metrics_territories === true) {
      changes.public_metrics_blacklist = [
        "weekly_installed_base_by_operating_system_normalized",
      ];
    }

    if (fieldValues.public_metrics_distros === true) {
      changes.public_metrics_blacklist = ["installed_base_by_country_percent"];
    }

    if (
      fieldValues.public_metrics_territories === true &&
      fieldValues.public_metrics_distros === true
    ) {
      changes.public_metrics_blacklist = [];
    }

    if (
      fieldValues.public_metrics_territories === false &&
      fieldValues.public_metrics_distros === false
    ) {
      changes.public_metrics_blacklist = [
        "installed_base_by_country_percent",
        "weekly_installed_base_by_operating_system_normalized",
      ];
    }
  }

  return changes;
}
