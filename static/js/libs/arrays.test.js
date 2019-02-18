import { arraysEqual } from "./arrays";

describe("arraysEqual", () => {
  it("empty arrays are equal", () => {
    expect(arraysEqual([], [])).toEqual(true);
  });

  it("arrays of booleans are equal", () => {
    expect(arraysEqual([true], [true])).toEqual(true);
  });

  it("arrays of strings are equal", () => {
    expect(arraysEqual(["test"], ["test"])).toEqual(true);
  });

  it("arrays of numbers are equal", () => {
    expect(arraysEqual([1], [1])).toEqual(true);
  });

  it("arrays of objects are equal", () => {
    expect(arraysEqual([{ test: "test" }], [{ test: "test" }])).toEqual(true);
  });

  it("the same array is equal", () => {
    const arr = ["test", 1];
    expect(arraysEqual(arr, arr)).toEqual(true);
  });

  it("fails if the length of arrays are different", () => {
    expect(arraysEqual([1], [1, 2])).toEqual(false);
  });

  it("fails if an array of booleans differ", () => {
    expect(arraysEqual([true], [false])).toEqual(false);
  });

  it("fails if an array of strings differ", () => {
    expect(arraysEqual(["a"], ["b"])).toEqual(false);
  });

  it("fails if an array of numbers differ", () => {
    expect(arraysEqual([1], [2])).toEqual(false);
  });

  it("fails if an array of objects differ", () => {
    expect(arraysEqual([{ test: "test" }], [{ test: "test2" }])).toEqual(false);
  });
});
