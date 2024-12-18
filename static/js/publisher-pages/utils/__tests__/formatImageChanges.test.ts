import formatImageChanges from "../formatImageChanges";

describe("formatImageChanges", () => {
  test("returns formatted image objects", () => {
    const imageChanges = formatImageChanges(
      ["https://example.com/banner"],
      "https://example.com/icon",
      ["https://example.com/screenshot"],
      [],
    );

    expect(imageChanges[0].url).toBe("https://example.com/banner");
    expect(imageChanges[0].type).toBe("banner");
    expect(imageChanges[0].status).toBe("uploaded");

    expect(imageChanges[1].url).toBe("https://example.com/icon");
    expect(imageChanges[1].type).toBe("icon");
    expect(imageChanges[1].status).toBe("uploaded");

    expect(imageChanges[2].url).toBe("https://example.com/screenshot");
    expect(imageChanges[2].type).toBe("screenshot");
    expect(imageChanges[2].status).toBe("uploaded");
  });
});
