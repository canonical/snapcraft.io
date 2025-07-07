import maskString from "../maskString";

describe("maskString", () => {
  const str = "761bbec69e2844958fcdj48DfP";

  it("returns an empty string if no argument is given", () => {
    expect(maskString(undefined)).toEqual("");
  });

  it("returns the given argument if less than or equal to 12 characters", () => {
    expect(maskString("a")).toEqual("a");
    expect(maskString("ab")).toEqual("ab");
    expect(maskString("abc")).toEqual("abc");
    expect(maskString("abcd")).toEqual("abcd");
    expect(maskString("abcde")).toEqual("abcde");
    expect(maskString("abcdef")).toEqual("abcdef");
    expect(maskString("abcdefg")).toEqual("abcdefg");
    expect(maskString("abcdefgh")).toEqual("abcdefgh");
    expect(maskString("abcdefghi")).toEqual("abcdefghi");
    expect(maskString("abcdefghij")).toEqual("abcdefghij");
    expect(maskString("abcdefghijk")).toEqual("abcdefghijk");
  });

  it("returns the last 12 charcters with a prepended ellipsis", () => {
    expect(maskString(str)).toEqual("...958fcdj48DfP");
  });
});
