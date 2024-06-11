import validateAspectRatio from "../validateAspectRatio";

describe("validateAspectRatio", () => {
  test("returns false if doesn't match aspect ratio", () => {
    expect(validateAspectRatio(300, 100, { width: 1, height: 1 }));
    expect(validateAspectRatio(140, 900, { width: 16, height: 9 }));
  });

  test("returns true if matches aspect ratio", () => {
    expect(validateAspectRatio(100, 100, { width: 1, height: 1 }));
    expect(validateAspectRatio(1600, 900, { width: 16, height: 9 }));
  });
});
