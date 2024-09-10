import getListingFormData from "../getListingFormData";

describe("getListingFormData", () => {
  window.CSRF_TOKEN = "test_token";

  const data = {
    title: "Lorem ipsum",
    summary: "Lorem ipsum",
    description: "Lorem ipsum",
    video_urls: ["https://example.com/video.mp4"],
    website: "https://example.com",
    contact: "mailto:name@example.com",
    "primary-category": "data",
    "secondary-category": "security",
    public_metrics_enabled: true,
    public_metrics_blacklist: true,
    license: "MIT",
    images: [{ name: "image", url: "https://example.com/image.jpg" }],
    contacts: [{ url: "https://example.com" }],
    donations: [{ url: "https://example.com" }],
    issues: [{ url: "https://example.com" }],
    "source-code": [{ url: "https://example.com" }],
    websites: [{ url: "https://example.com" }],
    icon: [{ url: "https://example.com" }],
    banner: [{ url: "https://example.com" }],
    screenshots: [{ url: "https://example.com" }],
  };

  const changes = {
    title: true,
    summary: true,
    description: true,
    video_urls: true,
    website: true,
    contact: true,
    categories: true,
    public_metrics_enabled: true,
    public_metrics_blacklist: true,
    license: true,
    images: [{ name: "image-name", url: "https://example.com/test-image.jpg" }],
    links: true,
  };

  test("returns form data", () => {
    const formData = getListingFormData(data, "test-snap-id", changes);

    expect(formData.get("csrf_token")).toEqual("test_token");
    expect(formData.get("snap_id")).toEqual("test-snap-id");
    expect(formData.get("title")).toBeDefined();
    expect(formData.get("summary")).toBeDefined();
    expect(formData.get("description")).toBeDefined();
    expect(formData.get("video_urls")).toBeDefined();
    expect(formData.get("website")).toBeDefined();
    expect(formData.get("contact")).toBeDefined();
    expect(formData.get("primary-category")).toBeDefined();
    expect(formData.get("secondary-category")).toBeDefined();
    expect(formData.get("public_metrics_enabled")).toBeDefined();
    expect(formData.get("public_metrics_blacklist")).toBeDefined();
    expect(formData.get("license")).toBeDefined();
    expect(formData.get("images")).toBeDefined();
    expect(formData.get("links")).toBeDefined();
    expect(formData.get("icon")).toBeDefined();
    expect(formData.get("banner-image")).toBeDefined();
    expect(formData.get("screenshots")).toBeDefined();
    expect(formData.get("changes")).toBeDefined();
  });
});
