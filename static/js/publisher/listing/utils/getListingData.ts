type License = {
  key: string;
  name: string;
};

const licenseSort = (a: License, b: License) => {
  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }

  return 0;
};

function getListingData(listingData: { [key: string]: any }) {
  return {
    snap_name: listingData?.snap_name,
    title: listingData?.snap_title,
    summary: listingData?.summary,
    description: listingData?.description,
    website: listingData?.website,
    contact: listingData?.contact,
    categories: listingData?.categories,
    images: [],
    public_metrics_enabled: listingData?.public_metrics_enabled,
    public_metrics_blacklist: listingData?.public_metrics_blacklist,
    license: listingData?.license,
    license_type: listingData?.license_type,
    licenses: listingData?.licenses.sort(licenseSort),
    video_urls: listingData?.video_urls[0],
    "primary-category": listingData?.snap_categories?.categories[0],
    "secondary-category": listingData?.snap_categories?.categories[1],
    public_metrics_territories: !listingData?.public_metrics_blacklist.includes(
      "installed_base_by_country_percent"
    ),
    public_metrics_distros: !listingData?.public_metrics_blacklist.includes(
      "weekly_installed_base_by_operating_system_normalized"
    ),
    update_metadata_on_release: listingData?.update_metadata_on_release,
    contacts: listingData?.links?.contact.map((link: string) => {
      return {
        url: link,
      };
    }),
    donations: listingData?.links?.donation.map((link: string) => {
      return {
        url: link,
      };
    }),
    issues: listingData?.links?.issues.map((link: string) => {
      return {
        url: link,
      };
    }),
    "source-code": listingData?.links?.["source-code"].map((link: string) => {
      return {
        url: link,
      };
    }),
    websites: listingData?.links?.website.map((link: string) => {
      return {
        url: link,
      };
    }),
  };
}

export default getListingData;
