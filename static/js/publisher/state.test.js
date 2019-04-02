import { updateState, diffState, commaSeperatedStringToArray } from "./state";

describe("updateState", () => {
  let state;

  beforeEach(() => {
    state = {
      title: "Default test title"
    };
  });

  describe("when passing FormData values", () => {
    let formData;

    beforeEach(() => {
      formData = new FormData();
    });

    test("should add value from allowed keys", () => {
      formData.set("summary", "Test summary");
      updateState(state, formData);

      expect(state.summary).toBe("Test summary");
    });

    test("should update value from allowed keys", () => {
      formData.set("title", "Test title");
      updateState(state, formData);

      expect(state.title).toBe("Test title");
    });

    test("should not add value not from allowed keys", () => {
      formData.set("something", "Test something");
      updateState(state, formData);

      expect(state.something).toBeUndefined();
    });
  });

  describe("when passing object with values", () => {
    test("should add value from allowed keys", () => {
      updateState(state, {
        summary: "Test summary"
      });

      expect(state.summary).toBe("Test summary");
    });

    test("should update value from allowed keys", () => {
      updateState(state, {
        title: "Test title"
      });

      expect(state.title).toBe("Test title");
    });

    test("should not add value not from allowed keys", () => {
      updateState(state, {
        something: "Test something"
      });

      expect(state.something).toBeUndefined();
    });
  });
});

describe("diffState", () => {
  test("should return null if states are equal is empty", () => {
    expect(
      diffState(
        {
          title: "Test title"
        },
        {
          title: "Test title"
        }
      )
    ).toBeNull();
  });

  test("should return diff containing only changed fields", () => {
    expect(
      diffState(
        {
          title: "Test title",
          summary: "Test summary"
        },
        {
          title: "Test title",
          summary: "Test summary changed",
          something: "Test something"
        }
      )
    ).toEqual({
      summary: "Test summary changed"
    });
  });

  // when comparing images
  describe("when comparing images in state", () => {
    test("should ignore selected status", () => {
      expect(
        diffState(
          {
            images: [
              { url: "test1.png", status: "uploaded" },
              { url: "test2.png", status: "uploaded" }
            ]
          },
          {
            images: [
              { url: "test1.png", status: "uploaded", selected: false },
              { url: "test2.png", status: "uploaded", selected: true }
            ]
          }
        )
      ).toBeNull();
    });
  });
});

describe("commaSeperatedStringToArray", () => {
  test("should return empty array if single value is blank", () => {
    expect(commaSeperatedStringToArray("")).toEqual([]);
  });

  test("should return empty array if all values are blank", () => {
    expect(commaSeperatedStringToArray(", ")).toEqual([]);
  });

  test("should return an array if single value is not blank", () => {
    expect(commaSeperatedStringToArray("test")).toEqual(["test"]);
  });

  test("should return an array if multiple values are not blank", () => {
    expect(commaSeperatedStringToArray("test, test2")).toEqual([
      "test",
      "test2"
    ]);
  });

  test("should return a single element array if multiple values and 1 is blank", () => {
    expect(commaSeperatedStringToArray("test, ")).toEqual(["test"]);
    expect(commaSeperatedStringToArray(", test")).toEqual(["test"]);
  });

  test("should return multiple elements with comma and space", () => {
    expect(commaSeperatedStringToArray("test, test2")).toEqual([
      "test",
      "test2"
    ]);
  });

  test("should return multuple elements with comma and no space", () => {
    expect(commaSeperatedStringToArray("test,test2")).toEqual([
      "test",
      "test2"
    ]);
  });
});
