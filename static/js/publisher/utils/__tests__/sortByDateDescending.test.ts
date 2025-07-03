import sortByDateDescending from "../sortByDateDescending";

const earlyItem = { "created-at": "2023-06-21T14:10:07.108051" };
const lateItem = { "created-at": "2023-06-22T12:45:28.301419" };

describe("sortByDateDescending", () => {
  it("returns 1 if first date is before second date", () => {
    expect(sortByDateDescending(earlyItem, lateItem)).toEqual(1);
  });

  it("returns -1 if first date is after second date", () => {
    expect(sortByDateDescending(lateItem, earlyItem)).toEqual(-1);
  });

  it("returns 0 if dates are the same", () => {
    expect(sortByDateDescending(earlyItem, earlyItem)).toEqual(0);
  });
});
