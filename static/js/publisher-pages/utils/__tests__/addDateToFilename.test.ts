import addDateToFilename from "../addDateToFilename";

describe("addDateToFilename", () => {
  test("adds date to filename", () => {
    const date = new Date();
    const now = Math.round(date.getTime() / 1000);
    const file = addDateToFilename(new File([], "test.jpg"), date);
    expect(file.name).toBe(`test-${now}.jpg`);
  });
});
