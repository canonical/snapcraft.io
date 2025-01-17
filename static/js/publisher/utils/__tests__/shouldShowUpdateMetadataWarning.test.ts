import shouldShowUpdateMetadataWarning from "../shouldShowUpdateMetadataWarning";

describe("shouldShowUpdateMetadataWarning", () => {
  test("returns false if only allowed keys have changed", () => {
    expect(
      shouldShowUpdateMetadataWarning({
        banner_urls: true,
        icon_url: true,
        screenshot_urls: true,
      }),
    ).toBe(false);
  });

  test("returns true if not allowed keys have changed", () => {
    expect(shouldShowUpdateMetadataWarning({ name: true })).toBe(true);
  });
});
