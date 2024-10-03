import validateImageDimensions from "../validateImageDimensions";

const validationSchema = {
  minWidth: 480,
  maxWidth: 4320,
  minHeight: 480,
  maxHeight: 2160,
};

describe("validateImageDimensions", () => {
  test("returns false if width is too large", () => {
    expect(validateImageDimensions(5000, 480, validationSchema));
  });

  test("returns false if width is too wide", () => {
    expect(validateImageDimensions(300, 480, validationSchema));
  });

  test("returns false if height is too large", () => {
    expect(validateImageDimensions(480, 3000, validationSchema));
  });

  test("returns false if height is too small", () => {
    expect(validateImageDimensions(480, 300, validationSchema));
  });

  test("returns true if dimensions are within sizes range", () => {
    expect(validateImageDimensions(3000, 1000, validationSchema));
  });
});
