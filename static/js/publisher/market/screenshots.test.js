import { templates, initSnapScreenshotsEdit } from "./screenshots";

describe("templates", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = document.createElement("div");
  });

  describe("row template", () => {
    it("should render content in Vanilla row pattern", () => {
      const result = templates.row("test-content");
      wrapper.innerHTML = result;

      expect(result).toContain("test-content");
      expect(wrapper.querySelector(".row")).not.toBeNull();
    });
  });

  describe("empty template", () => {
    it("should render `Add images` link", () => {
      const result = templates.empty();
      wrapper.innerHTML = result;

      expect(result).toContain("Add images");
      expect(wrapper.querySelector(".js-add-screenshots")).not.toBeNull();
    });
  });

  describe("screenshot template", () => {
    it("should render image with screenshot url", () => {
      const screenshot = { url: "test-screenshot.png" };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(wrapper.querySelector("img").src).toBe(screenshot.url);
    });

    it("should mark selected screenshots", () => {
      const screenshot = { url: "test-screenshot.png", selected: true };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(
        wrapper.querySelector(".p-screenshot").classList.contains("is-selected")
      ).toBe(true);
    });

    it("should mark deleted screenshots", () => {
      const screenshot = { url: "test-screenshot.png", status: "delete" };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(
        wrapper.querySelector(".p-screenshot").classList.contains("is-deleted")
      ).toBe(true);
    });
  });

  describe("changes template", () => {
    it("should render empty if no screenshots changed", () => {
      const result = templates.changes(0, 0);
      expect(result).toBe("");
    });

    it("should render singular when there is 1 screenshot to upload", () => {
      const result = templates.changes(1, 0);
      expect(result).toContain("1 image to upload");
      expect(result).not.toContain("to delete");
    });

    it("should render plural when there is more screenshots to upload", () => {
      const result = templates.changes(2, 0);
      expect(result).toContain("2 images to upload");
      expect(result).not.toContain("to delete");
    });

    it("should render singular when there is 1 screenshot to delete", () => {
      const result = templates.changes(0, 1);
      expect(result).not.toContain("to upload");
      expect(result).toContain("1 image to delete");
    });

    it("should render plural when there is more screenshots to upload", () => {
      const result = templates.changes(0, 2);
      expect(result).not.toContain("to upload");
      expect(result).toContain("2 images to delete");
    });

    it("should render both when needed", () => {
      const result = templates.changes(3, 2);
      expect(result).toContain("3 images to upload");
      expect(result).toContain("2 images to delete");
    });
  });
});

describe("initSnapScreenshotsEdit", () => {
  let screenshotsEl;
  let screenshotsToolbarEl;
  let screenshotsWrapperEl;
  let addScreenshotButton;
  let deleteScreenshotButton;
  let fullscreenScreenshotButton;
  let setState;

  beforeEach(() => {
    screenshotsEl = document.createElement("div");

    screenshotsWrapperEl = document.createElement("div");
    screenshotsWrapperEl.id = "screenshots-wrapper-el";
    screenshotsEl.appendChild(screenshotsWrapperEl);

    screenshotsToolbarEl = document.createElement("div");
    screenshotsToolbarEl.id = "screenshots-toolbar";

    addScreenshotButton = document.createElement("button");
    addScreenshotButton.className = "js-add-screenshots";
    screenshotsToolbarEl.appendChild(addScreenshotButton);

    deleteScreenshotButton = document.createElement("button");
    deleteScreenshotButton.className = "js-delete-screenshot";
    screenshotsToolbarEl.appendChild(deleteScreenshotButton);

    fullscreenScreenshotButton = document.createElement("button");
    fullscreenScreenshotButton.className = "js-fullscreen-screenshot";
    screenshotsToolbarEl.appendChild(fullscreenScreenshotButton);

    screenshotsEl.appendChild(screenshotsToolbarEl);

    document.body.appendChild(screenshotsEl);

    setState = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("render", () => {
    it("renders without a screenshot", () => {
      const state = { images: [] };

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );

      expect(
        screenshotsWrapperEl.querySelectorAll(".p-empty-add-screenshots").length
      ).toEqual(1);
    });

    it("renders a single screenshot", () => {
      const state = {
        images: [
          {
            type: "screenshot",
            url: "test"
          }
        ]
      };

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );
      expect(
        screenshotsWrapperEl.querySelectorAll(".p-screenshot__image").length
      ).toEqual(1);
      expect(deleteScreenshotButton.getAttribute("disabled")).toEqual(
        "disabled"
      );
      expect(fullscreenScreenshotButton.getAttribute("disabled")).toEqual(
        "disabled"
      );
    });

    it("renders multiple screenshots", () => {
      const state = { images: [] };

      let i = 0;
      while (i < 2) {
        state.images.push({
          type: "screenshot",
          url: `test${i}`
        });
        i++;
      }

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );
      expect(
        screenshotsWrapperEl.querySelectorAll(".p-screenshot__image").length
      ).toEqual(2);
    });

    it("disables the add screenshot button at 5 screenshots", () => {
      const state = { images: [] };

      let i = 0;
      while (i < 5) {
        state.images.push({
          type: "screenshot",
          url: `test${i}`
        });
        i++;
      }

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );
      expect(addScreenshotButton.getAttribute("disabled")).toEqual("disabled");
    });

    it("renders two rows", () => {
      const state = { images: [] };

      let i = 0;
      while (i < 8) {
        state.images.push({
          type: "screenshot",
          url: `test${i}`
        });
        i++;
      }

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );
      expect(screenshotsWrapperEl.querySelectorAll(".row").length).toEqual(3);
    });

    it("enables deleting and fullscreening when image is selected", () => {
      const state = {
        images: [
          {
            type: "screenshot",
            url: "test",
            selected: true
          }
        ]
      };

      initSnapScreenshotsEdit(
        "screenshots-toolbar",
        "screenshots-wrapper-el",
        state,
        setState
      );
      expect(deleteScreenshotButton.getAttribute("disabled")).toBeNull();
      expect(fullscreenScreenshotButton.getAttribute("disabled")).toBeNull();
    });
  });
});
