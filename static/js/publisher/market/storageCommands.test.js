import { storageCommands } from "./storageCommands";

describe("storage commands", () => {
  let ignoreChangeOnUnload;

  let context = {
    localStorage: {},
    location: {}
  };
  beforeEach(() => {
    context.localStorage.removeItem = jest.fn();
    context.focus = jest.fn();

    context.location.reload = jest.fn();
    ignoreChangeOnUnload = jest.fn();

    // We set these specifcally as they're undefined as part for jsdom
    window.localStorage = {
      removeItem: jest.fn()
    };
    window.focus = jest.fn();
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
    expect(window.localStorage.removeItem.mock.calls.length).toEqual(1);
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
          ignoreChangeOnUnload,
          context
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
          ignoreChangeOnUnload,
          context
        )
      ).toEqual(undefined);
    });
  });

  describe("edit", () => {
    beforeEach(() => {
      storageCommands(
        {
          key: "test-command",
          newValue: "edit"
        },
        document.createElement("form"),
        "test",
        ignoreChangeOnUnload,
        context
      );
    });
    it("removes the %-command key from localStorage", () => {
      expect(context.localStorage.removeItem.mock.calls.length).toBe(1);
      expect(context.localStorage.removeItem.mock.calls[0][0]).toBe(
        "test-command"
      );
    });

    it("pulls focus to the window", () => {
      expect(context.focus.mock.calls.length).toBe(1);
    });
  });

  describe("revert", () => {
    beforeEach(() => {
      storageCommands(
        {
          key: "test-command",
          newValue: "revert"
        },
        document.createElement("form"),
        "test",
        ignoreChangeOnUnload,
        context
      );
    });

    it("removes the %-command key from localStorage", () => {
      expect(context.localStorage.removeItem.mock.calls.length).toBe(1);
      expect(context.localStorage.removeItem.mock.calls[0][0]).toBe(
        "test-command"
      );
    });

    it("calls ignoreChangesOnUnload", () => {
      expect(ignoreChangeOnUnload.mock.calls.length).toBe(1);
    });

    it("reloads the page", () => {
      expect(context.location.reload.mock.calls.length).toBe(1);
      expect(context.location.reload.mock.calls[0][0]).toBe(true);
    });
  });

  describe("save", () => {
    let form;
    let formSubmitEvent;
    beforeEach(() => {
      form = document.createElement("form");
      formSubmitEvent = jest.fn();
      form.addEventListener("submit", formSubmitEvent);

      storageCommands(
        {
          key: "test-command",
          newValue: "save"
        },
        form,
        "test",
        ignoreChangeOnUnload,
        context
      );
    });

    it("removes the %-command key from localStorage", () => {
      expect(context.localStorage.removeItem.mock.calls.length).toBe(1);
      expect(context.localStorage.removeItem.mock.calls[0][0]).toBe(
        "test-command"
      );
    });

    it("dispatches a submit event to the form", () => {
      expect(formSubmitEvent.mock.calls.length).toBe(1);
    });
  });
});
