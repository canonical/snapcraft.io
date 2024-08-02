import getChanges from "../getChanges";

describe("getChanges", () => {
  test("returns changes in data", () => {
    const changedFields = {
      description: true,
      summary: true,
    };
    const data = {
      snap_name: "test-snap",
      description: "lorem ipsum",
      summary: "lorem ipsum dolor sit amet",
    };

    const changes = getChanges(changedFields, data);

    expect(changes.description).toBe("lorem ipsum");
    expect(changes.summary).toBe("lorem ipsum dolor sit amet");
    expect(changes.snap_name).not.toBeDefined();
  });

  test("handles website changes in data", () => {
    const changedFields = {
      primary_website: true,
    };
    const data = {
      primary_website: "https://example.com",
      websites: [{ url: "https://test.com" }],
    };
    const changes = getChanges(changedFields, data);

    expect(changes.links.website[0]).toBe("https://example.com");
  });

  test("doesn't return changes for forbidden keys", () => {
    const changedFields = {
      "primary-category": true,
      "secondary-category": true,
      contacts: true,
      donations: true,
      issues: true,
      "source-code": true,
      websites: true,
      licenses: true,
    };

    const data = {
      "primary-category": "health-and-fitness",
      "secondary-category": "music-and-audio",
      contacts: [{ url: "mailto:name@example.com" }],
      donations: [{ url: "https://example.com" }],
      issues: [{ url: "https://example.com" }],
      "source-code": [{ url: "https://example.com" }],
      websites: [{ url: "https://example.com" }],
      licenses: [{ key: "Glide", name: "3dfx Glide License" }],
    };

    const changes = getChanges(changedFields, data);

    expect(changes["primary-category"]).not.toBeDefined();
    expect(changes["secondary-category"]).not.toBeDefined();
    expect(changes.contacts).not.toBeDefined();
    expect(changes.donations).not.toBeDefined();
    expect(changes.issues).not.toBeDefined();
    expect(changes["source-code"]).not.toBeDefined();
    expect(changes.websites).not.toBeDefined();
    expect(changes.licenses).not.toBeDefined();
  });

  test("handles image changes", () => {
    const data = {
      banner: new File([""], "test-banner", { type: "image" }),
      banner_url: "https://example.com/banner-image.jpg",
      banner_urls: ["https://example.com/banner-image.jpg"],
      icon: new File([""], "test-icon", { type: "image" }),
      icon_url: "https://example.com/icon-image.jpg",
      images: [
        {
          status: "uploaded",
          type: "icon",
          url: "https://example.com/icon-image.jpg",
        },
        {
          status: "uploaded",
          type: "screenshot",
          url: "https://example.com/screenshot-image.jpg",
        },
        {
          status: "uploaded",
          type: "banner",
          url: "https://example.com/banner-image.jpg",
        },
      ],
      screenshot_urls: ["https://example.com/screenshot-image.jpg"],
      screenshots: [new File([""], "test-screenshot", { type: "image" })],
    };

    const changedFields = {
      banner_url: true,
      icon_url: true,
      screenshot_urls: true,
      icon: true,
      banner: true,
      screenshots: true,
    };

    const changes = getChanges(changedFields, data);

    expect(changes.images).toHaveLength(3);
  });
});
