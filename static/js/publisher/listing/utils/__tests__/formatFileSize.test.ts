import formatFileSize from "../formatFileSize";

describe("formatFileSize", () => {
  test("formats file size in kB", () => {
    expect(formatFileSize(900)).toBe("0.9kB");
  });

  test("formats file size in MB", () => {
    expect(formatFileSize(2000000)).toBe("2MB");
  });
});
