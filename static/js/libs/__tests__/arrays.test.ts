import { arraysEqual, arrayChunk, arraysMerge } from "../arrays";

describe("arraysEqual", () => {
  it("should return empty arrays as equal", () => {
    expect(arraysEqual([], [])).toEqual(true);
  });

  it("should return arrays of booleans as equal", () => {
    expect(arraysEqual([true], [true])).toEqual(true);
  });

  it("should return arrays of strings as equal", () => {
    expect(arraysEqual(["a", "b", "c"], ["a", "b", "c"])).toEqual(true);
  });

  it("should return arrays of numbers as equal", () => {
    expect(arraysEqual([1], [1])).toEqual(true);
  });

  it("should return arrays of objects as equal", () => {
    expect(arraysEqual([{ test: "test" }], [{ test: "test" }])).toEqual(true);
  });

  it("should return the same array as equal", () => {
    const arr = ["test", 1];
    expect(arraysEqual(arr, arr)).toEqual(true);
  });

  it("should fail if the length of arrays are different", () => {
    expect(arraysEqual([1], [1, 2])).toEqual(false);
  });

  it("should fail if an array of booleans differ", () => {
    expect(arraysEqual([true], [false])).toEqual(false);
  });

  it("should fail if an array of strings differ", () => {
    expect(arraysEqual(["a", "b", "c"], ["a", "d", "c"])).toEqual(false);
  });

  it("should fail if an array of numbers differ", () => {
    expect(arraysEqual([1], [2])).toEqual(false);
  });

  it("should fail if an array of objects differ", () => {
    expect(arraysEqual([{ test: "test" }], [{ test: "test2" }])).toEqual(false);
  });

  it("should fail if an array is modified", () => {
    let arr1 = ["test1", 1];
    let arr1Copy = [...arr1];
    let arr2 = ["test2", 2];
    let arr2Copy = [...arr2];
    arraysEqual(arr1, arr2);
    expect(
      JSON.stringify(arr1) === JSON.stringify(arr1Copy) &&
        JSON.stringify(arr2) === JSON.stringify(arr2Copy)
    ).toEqual(true);
  });
});

describe("arrayChunk", () => {
  it("should split an array into the specified size", () => {
    expect(arrayChunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, 10],
    ]);

    expect(arrayChunk([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9],
    ]);
  });
});

describe("arraysMerge", () => {
  it("should merge two arrays", () => {
    expect(arraysMerge([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("should merge and dedupe two arrays", () => {
    expect(arraysMerge([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });
});
