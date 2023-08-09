import maskString from "./maskString";

describe("maskString", () => {
  const str = "761bbec69e2844958fcd";

  it("returns an empty string if no argument is given", () => {
    expect(maskString(undefined)).toEqual("");
  });

  it("returns the given argument if less than or equal to 6 characters", () => {
    expect(maskString("a")).toEqual("a");
    expect(maskString("ab")).toEqual("ab");
    expect(maskString("abc")).toEqual("abc");
    expect(maskString("abcd")).toEqual("abcd");
    expect(maskString("abcde")).toEqual("abcde");
    expect(maskString("abcdef")).toEqual("abcdef");
  });

  it("returns the last 6 charcters with a prepended ellipsis", () => {
    expect(maskString(str)).toEqual("...958fcd");
  });
});
