import getListingData from "../getListingData";

describe("getListingData", () => {
  test("returns listing data", () => {
    window.SNAP_LISTING_DATA = {
      icon_url: "https://example.com/icon.jpg",
      banner_urls: ["https://example.com/banner.jpg"],
      screenshot_urls: ["https://example.com/screenshot.jpg"],
      snap_categories: {
        categories: ["primary", "secondary"],
      },
      links: ["https://example.com"],
    };

    const data = {
      snap_name: "test",
      snap_title: "test",
      summary: "test",
      description: "test",
      website: "https://example.com",
      contact: "mailto:name@example.com",
      categories: ["primary", "secondary"],
      snap_categories: {
        categories: ["primary", "secondary"],
      },
      public_metrics_enabled: true,
      license: "test",
      license_type: "test",
      update_metadata_on_release: true,
      licenses: [{ name: "MIT" }, { name: "GNU" }],
      video_urls: ["https://example.com/video.mp4"],
      public_metrics_blacklist: ["installed_base_by_country_percent"],
    };

    const listingData = getListingData(data);

    expect(listingData.snap_name).toBeDefined();
    expect(listingData.title).toBeDefined();
    expect(listingData.summary).toBeDefined();
    expect(listingData.description).toBeDefined();
    expect(listingData.website).toBeDefined();
    expect(listingData.contact).toBeDefined();
    expect(listingData.categories).toBeDefined();
    expect(listingData.public_metrics_enabled).toBeDefined();
    expect(listingData.public_metrics_blacklist).toBeDefined();
    expect(listingData.license).toBeDefined();
    expect(listingData.license_type).toBeDefined();
    expect(listingData.licenses).toBeDefined();
    expect(listingData.video_urls).toBeDefined();
    expect(listingData["primary-category"]).toBeDefined();
    expect(listingData["secondary-category"]).toBeDefined();
    expect(listingData.public_metrics_territories).toBeDefined();
    expect(listingData.public_metrics_distros).toBeDefined();
    expect(listingData.update_metadata_on_release).toBeDefined();
    expect(listingData.contacts).toBeDefined();
    expect(listingData.donations).toBeDefined();
    expect(listingData.issues).toBeDefined();
    expect(listingData["source-code"]).toBeDefined();
    expect(listingData.websites).toBeDefined();
    expect(listingData.banner_urls).toBeDefined();
    expect(listingData.icon_url).toBeDefined();
    expect(listingData.screenshot_urls).toBeDefined();
    expect(listingData.icon).toBeDefined();
    expect(listingData.banner_url).toBeDefined();
    expect(listingData.banner).toBeDefined();
    expect(listingData.screenshots).toBeDefined();
    expect(listingData.images).toBeDefined();
    expect(listingData.snap_categories).toBeDefined();
    expect(listingData.links).toBeDefined();
    expect(listingData.primary_website).toBeDefined();
  });
});
