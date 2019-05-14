import { storageCommands } from "./storageCommands";

describe("storage commands", () => {
  let ignoreChangeOnUnload;

  beforeEach(() => {
    window.focus = jest.fn();
    window.location.reload = jest.fn();
    ignoreChangeOnUnload = jest.fn();
  });

  it("uses window if no context provided", () => {
    storageCommands(
      {
        key: "test-command",
        newValue: "edit"
      },
      document.createElement("form"),
      "test",
      ignoreChangeOnUnload
    );
  });

  describe("key doesn't match", () => {
    it("returns", () => {
      expect(
        storageCommands(
          {
            key: "test2-command",
            newValue: "edit"
          },
          document.createElement("form"),
          "test",
          ignoreChangeOnUnload
        )
      ).toEqual(undefined);
    });
  });

  describe("newValue doesn't match", () => {
    it("returns", () => {
      expect(
        storageCommands(
          {
            key: "test-command",
            newValue: "green"
          },
          document.createElement("form"),
          "test",
          ignoreChangeOnUnload
        )
      ).toEqual(undefined);
    });
  });

  describe("edit", () => {
    beforeEach(() => {
      window.localStorage.setItem("test-command", "remove me");

      storageCommands(
        {
          key: "test-command",
          newValue: "edit"
        },
        document.createElement("form"),
        "test",
        ignoreChangeOnUnload
      );
    });
    it("removes the %-command key from localStorage", () => {
      expect(window.localStorage.getItem("test-command")).toBe(null);
    });

    it("pulls focus to the window", () => {
      expect(window.focus.mock.calls.length).toBe(1);
    });
  });

  describe("revert", () => {
    beforeEach(() => {
      window.localStorage.setItem("test-command", "remove me");

      storageCommands(
        {
          key: "test-command",
          newValue: "revert"
        },
        document.createElement("form"),
        "test",
        ignoreChangeOnUnload
      );
    });

    it("removes the %-command key from localStorage", () => {
      expect(window.localStorage.getItem("test-command")).toBe(null);
    });

    it("calls ignoreChangesOnUnload", () => {
      expect(ignoreChangeOnUnload.mock.calls.length).toBe(1);
    });

    it("reloads the page", () => {
      expect(window.location.reload.mock.calls.length).toBe(1);
      expect(window.location.reload.mock.calls[0][0]).toBe(true);
    });
  });

  describe("save", () => {
    let form;
    let formSubmitEvent;
    beforeEach(() => {
      form = document.createElement("form");
      formSubmitEvent = jest.fn();
      form.addEventListener("submit", formSubmitEvent);

      window.localStorage.setItem("test-command", "remove me");

      storageCommands(
        {
          key: "test-command",
          newValue: "save"
        },
        form,
        "test",
        ignoreChangeOnUnload
      );
    });

    it("removes the %-command key from localStorage", () => {
      expect(window.localStorage.getItem("test-command")).toBe(null);
    });

    it("dispatches a submit event to the form", () => {
      expect(formSubmitEvent.mock.calls.length).toBe(1);
    });
  });
});
