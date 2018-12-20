import * as market from "./form";

describe("initSnapIconEdit", () => {
  let input;
  let icon;
  let state;

  beforeEach(() => {
    icon = document.createElement("a");
    icon.id = "test-icon-id";
    document.body.appendChild(icon);

    input = document.createElement("input");
    input.id = "test-id";
    document.body.appendChild(input);

    URL.createObjectURL = jest.fn().mockReturnValue("test-url");

    state = {
      images: []
    };
  });

  test("should set icon src on input change", () => {
    market.initSnapIconEdit("test-icon-id", "test-id", state);

    let event = new Event("change");
    // mock list of files on input
    Object.defineProperty(input, "files", {
      value: [{ name: "test.png" }]
    });
    input.dispatchEvent(event);

    expect(icon.src).toBe("test-url");
  });
});

describe("initForm", () => {
  let form;
  let submitButton;
  let revertButton;
  let titleInput;
  let primaryCategoryInput;
  let secondaryCategoryInput;
  let categoriesInput;

  function setupForm(config) {
    form = document.createElement("form");
    form.id = config.form;

    submitButton = document.createElement("button");
    submitButton.classList.add("js-form-submit");

    revertButton = document.createElement("a");
    revertButton.classList.add("js-form-revert");
    revertButton.href = "/test";

    titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.value = "test";

    primaryCategoryInput = document.createElement("input");
    primaryCategoryInput.type = "text";
    primaryCategoryInput.name = "primary_category";
    primaryCategoryInput.value = "";

    secondaryCategoryInput = document.createElement("input");
    secondaryCategoryInput.type = "text";
    secondaryCategoryInput.name = "secondary_category";
    secondaryCategoryInput.value = "";

    categoriesInput = document.createElement("input");
    categoriesInput.type = "text";
    categoriesInput.name = "categories";
    categoriesInput.value = "";

    form.appendChild(submitButton);
    form.appendChild(revertButton);
    form.appendChild(titleInput);

    document.body.appendChild(form);

    market.initForm(
      config,
      {
        title: "test"
      },
      undefined
    );
  }

  describe("simple", () => {
    const config = {
      form: "market-form"
    };

    beforeEach(() => {
      setupForm(config);
    });

    afterEach(() => {
      form.parentNode.removeChild(form);
    });

    test("creates state input", () => {
      const stateInput = document.querySelector("[name='state']");
      expect(stateInput.value).toEqual("");
    });

    test("creates diff input", () => {
      const diffInput = document.querySelector("[name='changes']");
      expect(diffInput.value).toEqual("");
    });

    test("disables the submit button", () => {
      expect(submitButton.getAttribute("disabled")).toEqual("");
    });

    test("disables the revert button", () => {
      expect(revertButton.classList.contains("is-disabled")).toEqual(true);
      expect(revertButton.href).toEqual("javascript:void(0);");
    });

    describe("on title change", () => {
      beforeEach(() => {
        titleInput.click();
        titleInput.value = "test2";
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      test("save is enabled", () => {
        expect(submitButton.getAttribute("disabled")).toBeNull();
      });

      test("revert is enabled", () => {
        expect(revertButton.classList.contains("is-disabled")).toEqual(false);
        expect(revertButton.href).toEqual("/test");
      });
    });

    describe("on submit", () => {
      beforeEach(() => {
        titleInput.click();
        titleInput.value = "test2";
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));

        form.dispatchEvent(new Event("submit"));
      });

      test("state is updated", () => {
        const stateInput = document.querySelector("[name='state']");
        expect(stateInput.value).toEqual(
          JSON.stringify({
            title: "test2"
          })
        );
      });

      test("diff is updated", () => {
        const diffInput = document.querySelector("[name='changes']");
        expect(diffInput.value).toEqual(
          JSON.stringify({
            title: "test2"
          })
        );
      });
    });
  });
});
