import maskString from "./maskString";

describe("maskString", () => {
  const str = "761bbec69e2844958fcd";

  it("returns the given argument if less than or equal to 4 characters", () => {
    expect(maskString("a")).toEqual("a");
    expect(maskString("ab")).toEqual("ab");
    expect(maskString("abc")).toEqual("abc");
    expect(maskString("abcd")).toEqual("abcd");
    expect(maskString("abcde")).toEqual("*bcde");
  });

  it("returns a string of asterisks and 4 characters", () => {
    expect(maskString(str)).toEqual("****************8fcd");
  });

  it("returns a string that same length as its given argument", () => {
    expect(maskString(str).length).toEqual(str.length);
  });
});
