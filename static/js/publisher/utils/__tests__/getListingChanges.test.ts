import getListingChanges from "../getListingChanges";

import { mockListingData } from "../../test-utils";

describe("getListingChanges", () => {
  test("sets images", () => {
    const changes = getListingChanges(
      { banner_urls: true },
      mockListingData,
      Object.assign(mockListingData, {
        banner: null,
        banner_urls: ["https://example.com/banner"],
        icon: null,
        icon_url: "https://example.com/icon",
        screenshot_urls: ["https://example.com/screenshot"],
        screenshots: null,
      }),
    );

    expect(changes.images).toBeDefined();

    if (changes.images) {
      expect(changes.images).toHaveLength(3);
      expect(changes.images[0].url).toEqual("https://example.com/banner");
      expect(changes.images[0].type).toEqual("banner");
      expect(changes.images[0].status).toEqual("uploaded");

      expect(changes.images[1].url).toEqual("https://example.com/icon");
      expect(changes.images[1].type).toEqual("icon");
      expect(changes.images[1].status).toEqual("uploaded");

      expect(changes.images[2].url).toEqual("https://example.com/screenshot");
      expect(changes.images[2].type).toEqual("screenshot");
      expect(changes.images[2].status).toEqual("uploaded");
    }
  });

  test("sets contacts links", () => {
    const changes = getListingChanges(
      { contacts: true },
      mockListingData,
      Object.assign(mockListingData, {
        contacts: [{ url: "https://example.com/contact" }],
        donations: [],
        issues: [],
        source_code: [],
        websites: [],
      }),
    );

    expect(changes.links).toBeDefined();

    if (changes.links) {
      expect(changes.links.contact).toHaveLength(1);
      expect(changes.links.contact[0]).toEqual("https://example.com/contact");
    }
  });

  test("sets donations links", () => {
    const changes = getListingChanges(
      { donations: true },
      mockListingData,
      Object.assign(mockListingData, {
        contacts: [],
        donations: [{ url: "https://example.com/donations" }],
        issues: [],
        source_code: [],
        websites: [],
      }),
    );

    expect(changes.links).toBeDefined();

    if (changes.links) {
      expect(changes.links.donations).toHaveLength(1);
      expect(changes.links.donations[0]).toEqual(
        "https://example.com/donations",
      );
    }
  });

  test("sets issues links", () => {
    const changes = getListingChanges(
      { issues: true },
      mockListingData,
      Object.assign(mockListingData, {
        contacts: [],
        donations: [],
        issues: [{ url: "https://example.com/issues" }],
        source_code: [],
        websites: [],
      }),
    );

    expect(changes.links).toBeDefined();

    if (changes.links) {
      expect(changes.links.issues).toHaveLength(1);
      expect(changes.links.issues[0]).toEqual("https://example.com/issues");
    }
  });

  test("sets source_code links", () => {
    const changes = getListingChanges(
      { source_code: true },
      mockListingData,
      Object.assign(mockListingData, {
        contacts: [],
        donations: [],
        issues: [],
        source_code: [{ url: "https://example.com/source" }],
        websites: [],
      }),
    );

    expect(changes.links).toBeDefined();

    if (changes.links) {
      expect(changes.links.source).toHaveLength(1);
      expect(changes.links.source[0]).toEqual("https://example.com/source");
    }
  });

  test("sets websites links", () => {
    const changes = getListingChanges(
      { websites: true },
      mockListingData,
      Object.assign(mockListingData, {
        contacts: [],
        donations: [],
        issues: [],
        primary_website: "",
        source_code: [],
        websites: [
          { url: "https://example.com/primary" },
          { url: "https://example.com/secondary" },
        ],
      }),
    );

    expect(changes.links).toBeDefined();

    if (changes.links) {
      expect(changes.links.website).toHaveLength(2);
      expect(changes.links.website[0]).toEqual("https://example.com/primary");
      expect(changes.links.website[1]).toEqual("https://example.com/secondary");
    }
  });

  test("sets description", () => {
    const changes = getListingChanges(
      { description: true },
      mockListingData,
      Object.assign(mockListingData, { description: "Test description" }),
    );

    expect(changes.description).toEqual("Test description");
  });

  test("sets summary", () => {
    const changes = getListingChanges(
      { summary: true },
      mockListingData,
      Object.assign(mockListingData, { summary: "Test summary" }),
    );

    expect(changes.summary).toEqual("Test summary");
  });

  test("sets title", () => {
    const changes = getListingChanges(
      { title: true },
      mockListingData,
      Object.assign(mockListingData, { title: "Test title" }),
    );

    expect(changes.title).toEqual("Test title");
  });

  test("sets primary category", () => {
    const changes = getListingChanges(
      {
        primary_category: true,
      },
      mockListingData,
      Object.assign(mockListingData, {
        primary_category: "test-primary-category",
        secondary_category: "",
      }),
    );

    expect(changes.categories).toBeDefined();

    if (changes.categories) {
      expect(changes.categories).toHaveLength(1);
      expect(changes.categories[0]).toEqual("test-primary-category");
    }
  });

  test("sets secondary category", () => {
    const changes = getListingChanges(
      {
        secondary_category: true,
      },
      mockListingData,
      Object.assign(mockListingData, {
        primary_category: "",
        secondary_category: "test-secondary-category",
      }),
    );

    expect(changes.categories).toBeDefined();

    if (changes.categories) {
      expect(changes.categories).toHaveLength(1);
      expect(changes.categories[0]).toEqual("test-secondary-category");
    }
  });

  test("sets primary and secondary category", () => {
    const changes = getListingChanges(
      {
        primary_category: true,
        secondary_category: true,
      },
      mockListingData,
      Object.assign(mockListingData, {
        primary_category: "test-primary-category",
        secondary_category: "test-secondary-category",
      }),
    );

    expect(changes.categories).toBeDefined();

    if (changes.categories) {
      expect(changes.categories).toHaveLength(2);
      expect(changes.categories[0]).toEqual("test-primary-category");
      expect(changes.categories[1]).toEqual("test-secondary-category");
    }
  });

  test("sets public_metrics_blacklist if only territories", () => {
    const changes = getListingChanges(
      { public_metrics_distros: true, public_metrics_territories: true },
      mockListingData,
      Object.assign(mockListingData, {
        public_metrics_distros: false,
        public_metrics_territories: true,
      }),
    );

    expect(changes.public_metrics_blacklist).toBeDefined();

    if (changes.public_metrics_blacklist) {
      expect(changes.public_metrics_blacklist).toHaveLength(1);
      expect(changes.public_metrics_blacklist[0]).toEqual(
        "weekly_installed_base_by_operating_system_normalized",
      );
    }
  });

  test("sets public_metrics_blacklist if distros", () => {
    const changes = getListingChanges(
      { public_metrics_distros: true, public_metrics_territories: true },
      mockListingData,
      Object.assign(mockListingData, {
        public_metrics_distros: true,
        public_metrics_territories: false,
      }),
    );

    expect(changes.public_metrics_blacklist).toBeDefined();

    if (changes.public_metrics_blacklist) {
      expect(changes.public_metrics_blacklist).toHaveLength(1);
      expect(changes.public_metrics_blacklist[0]).toEqual(
        "installed_base_by_country_percent",
      );
    }
  });

  test("sets public_metrics_blacklist if territories and distros", () => {
    const changes = getListingChanges(
      { public_metrics_distros: true, public_metrics_territories: true },
      mockListingData,
      Object.assign(mockListingData, {
        public_metrics_distros: true,
        public_metrics_territories: true,
      }),
    );

    expect(changes.public_metrics_blacklist).toBeDefined();

    if (changes.public_metrics_blacklist) {
      expect(changes.public_metrics_blacklist).toHaveLength(0);
    }
  });

  test("sets public_metrics_blacklist if not territories or distros", () => {
    const changes = getListingChanges(
      { public_metrics_distros: true, public_metrics_territories: true },
      mockListingData,
      Object.assign(mockListingData, {
        public_metrics_distros: false,
        public_metrics_territories: false,
      }),
    );

    expect(changes.public_metrics_blacklist).toBeDefined();

    if (changes.public_metrics_blacklist) {
      expect(changes.public_metrics_blacklist).toHaveLength(2);
      expect(changes.public_metrics_blacklist[0]).toEqual(
        "installed_base_by_country_percent",
      );
      expect(changes.public_metrics_blacklist[1]).toEqual(
        "weekly_installed_base_by_operating_system_normalized",
      );
    }
  });
});
