type License = {
  key: string;
  name: string;
};

const getOtherWebsites = (websites: Array<string>) => {
  if (websites.length > 1) {
    return websites.slice(1, websites.length).map((url) => ({ url })) as Array<{
      url: string;
    }>;
  }

  return [] as [];
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
  let images = [];

  if (window.SNAP_LISTING_DATA.icon_url) {
    images.push({
      url: window.SNAP_LISTING_DATA.icon_url,
      type: "icon",
      status: "uploaded",
    });
  }

  if (window.SNAP_LISTING_DATA.banner_urls.length) {
    images.push({
      url: window.SNAP_LISTING_DATA.banner_urls[0],
      type: "banner",
      status: "uploaded",
    });
  }

  if (window.SNAP_LISTING_DATA.screenshot_urls) {
    images = images.concat(
      window.SNAP_LISTING_DATA.screenshot_urls.map((url: string) => {
        return {
          url,
          type: "screenshot",
          status: "uploaded",
        };
      })
    );
  }

  return {
    snap_name: listingData?.snap_name,
    title: listingData?.snap_title,
    summary: listingData?.summary,
    description: listingData?.description,
    website: listingData?.website,
    contact: listingData?.contact,
    categories: listingData?.categories,
    public_metrics_enabled: listingData?.public_metrics_enabled,
    public_metrics_blacklist: listingData?.public_metrics_blacklist,
    license: listingData?.license,
    license_type: listingData?.license_type,
    licenses: listingData?.licenses.sort(licenseSort),
    video_urls: listingData?.video_urls[0] || "",
    "primary-category": listingData?.snap_categories?.categories[0],
    "secondary-category": listingData?.snap_categories?.categories[1],
    public_metrics_territories: !listingData?.public_metrics_blacklist.includes(
      "installed_base_by_country_percent"
    ),
    public_metrics_distros: !listingData?.public_metrics_blacklist.includes(
      "weekly_installed_base_by_operating_system_normalized"
    ),
    update_metadata_on_release: listingData?.update_metadata_on_release,
    contacts:
      listingData.links && listingData.links.contact
        ? listingData.links.contact.map((link: string) => {
            return {
              url: link,
            };
          })
        : [],
    donations:
      listingData.links && listingData.links.donations
        ? listingData.links.donations.map((link: string) => {
            return {
              url: link,
            };
          })
        : [],
    issues:
      listingData.links && listingData.links.issues
        ? listingData.links.issues.map((link: string) => {
            return {
              url: link,
            };
          })
        : [],
    "source-code":
      listingData.links && listingData.links["source"]
        ? listingData.links["source"].map((link: string) => {
            return {
              url: link,
            };
          })
        : [],
    primary_website:
      listingData.links && listingData.links.website
        ? listingData.links.website[0]
        : "",
    websites:
      listingData.links && listingData.links.website
        ? getOtherWebsites(listingData.links.website)
        : [],
    banner_urls: window.SNAP_LISTING_DATA.banner_urls,
    icon_url: window.SNAP_LISTING_DATA.icon_url,
    screenshot_urls: window.SNAP_LISTING_DATA.screenshot_urls,
    icon: new File([], ""),
    banner_url: window.SNAP_LISTING_DATA.banner_urls[0],
    banner: new File([], ""),
    screenshots: [
      new File([], ""),
      new File([], ""),
      new File([], ""),
      new File([], ""),
      new File([], ""),
    ],
    images,
    snap_categories: window.SNAP_LISTING_DATA.snap_categories?.categories,
    links: window.SNAP_LISTING_DATA.links,
  };
}

export default getListingData;
