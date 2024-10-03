import getDefaultListingData from "../getDefaultListingData";

import { mockListingData } from "../../test-utils";

describe("getDefaultData", () => {
  test("returns default data", () => {
    const defaultData = getDefaultListingData(mockListingData);

    expect(defaultData.contacts).toBeDefined();
    expect(defaultData.description).toBeDefined();
    expect(defaultData.donations).toBeDefined();
    expect(defaultData.icon_url).toBeDefined();
    expect(defaultData.issues).toBeDefined();
    expect(defaultData.license).toBeDefined();
    expect(defaultData.licenses).toBeDefined();
    expect(defaultData.license_type).toBeDefined();
    expect(defaultData.primary_category).toBeDefined();
    expect(defaultData.primary_website).toBeDefined();
    expect(defaultData.public_metrics_distros).toBeDefined();
    expect(defaultData.public_metrics_enabled).toBeDefined();
    expect(defaultData.public_metrics_territories).toBeDefined();
    expect(defaultData.screenshots).toBeDefined();
    expect(defaultData.screenshot_urls).toBeDefined();
    expect(defaultData.secondary_category).toBeDefined();
    expect(defaultData.source_code).toBeDefined();
    expect(defaultData.summary).toBeDefined();
    expect(defaultData.title).toBeDefined();
    expect(defaultData.video_urls).toBeDefined();
    expect(defaultData.websites).toBeDefined();

    expect(defaultData.banner_urls).not.toBeDefined();
    expect(defaultData.categories).not.toBeDefined();
    expect(defaultData.public_metrics_blacklist).not.toBeDefined();
    expect(defaultData.snap_id).not.toBeDefined();
    expect(defaultData.tour_steps).not.toBeDefined();
    expect(defaultData.update_metadata_on_release).not.toBeDefined();
  });
});
