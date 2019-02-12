import * as market from "./form";
import * as categories from "./market/categories";

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
  let previewButton;
  let titleInput;
  let summaryInput;
  let descriptionInput;
  let websiteInput;
  let contactInput;
  let primaryCategoryInput;
  let secondaryCategoryInput;
  let categoriesInput;
  let csrfInput;

  const categoriesList = ["", "test1", "test2"];

  function setupForm(config, initialState) {
    form = document.createElement("form");
    form.id = config.form;

    submitButton = document.createElement("button");
    submitButton.classList.add("js-form-submit");

    revertButton = document.createElement("a");
    revertButton.classList.add("js-form-revert");
    revertButton.href = "/test";

    previewButton = document.createElement("a");
    previewButton.classList.add("js-listing-preview");
    previewButton.href = "/test";

    titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.value = initialState.title;
    titleInput.required = "true";
    titleInput.maxlength = "64";

    categoriesInput = document.createElement("input");
    categoriesInput.type = "text";
    categoriesInput.name = "categories";
    categoriesInput.value = initialState.categories;

    primaryCategoryInput = document.createElement("select");
    primaryCategoryInput.name = "primary_category";
    primaryCategoryInput.value = "";

    categoriesList.forEach((category, index) => {
      const option = document.createElement("option");
      option.value = category;
      if (index === 0) {
        option.selected = "selected";
      }
      primaryCategoryInput.appendChild(option);
    });

    secondaryCategoryInput = document.createElement("select");
    secondaryCategoryInput.name = "secondary_category";
    secondaryCategoryInput.value = "";

    categoriesList.forEach((category, index) => {
      const option = document.createElement("option");
      option.value = category;
      if (index === 0) {
        option.selected = "selected";
      }
      secondaryCategoryInput.appendChild(option);
    });

    summaryInput = document.createElement("input");
    summaryInput.type = "text";
    summaryInput.name = "summary";
    summaryInput.value = initialState.summary;
    summaryInput.required = "true";
    summaryInput.maxlength = "128";

    descriptionInput = document.createElement("textarea");
    descriptionInput.name = "description";
    descriptionInput.rows = "10";
    descriptionInput.required = "true";
    descriptionInput.value = initialState.description;

    websiteInput = document.createElement("input");
    websiteInput.type = "url";
    websiteInput.name = "website";
    websiteInput.maxlength = "256";
    websiteInput.value = initialState.website;

    contactInput = document.createElement("input");
    contactInput.type = "url";
    contactInput.name = "contact";
    contactInput.value = initialState.contact;
    contactInput.maxlength = "256";

    csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrf_token";
    csrfInput.value = "test";

    form.appendChild(submitButton);
    form.appendChild(revertButton);
    form.appendChild(previewButton);
    form.appendChild(titleInput);
    form.appendChild(categoriesInput);
    form.appendChild(primaryCategoryInput);
    form.appendChild(secondaryCategoryInput);
    form.appendChild(summaryInput);
    form.appendChild(descriptionInput);
    form.appendChild(websiteInput);
    form.appendChild(contactInput);
    form.appendChild(csrfInput);

    document.body.appendChild(form);

    categories.categories = jest.fn();
    market.initForm(config, initialState, undefined);
  }

  describe("form", () => {
    const config = {
      form: "market-form"
    };

    const initialState = {
      snap_name: "test",
      title: "test",
      categories: [],
      summary: "Summary",
      description: "Description",
      website: "https://example.com",
      contact: "mailto:test@example.com"
    };

    beforeEach(() => {
      setupForm(config, initialState);
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
      describe("with diffs", () => {
        beforeEach(() => {
          titleInput.click();
          titleInput.value = "test2";
          titleInput.dispatchEvent(new Event("change", { bubbles: true }));

          form.dispatchEvent(new Event("submit"));
        });

        test("state and diff are updated", () => {
          const stateInput = document.querySelector("[name='state']");
          expect(stateInput.value).toEqual(
            JSON.stringify(
              Object.assign(initialState, {
                title: "test2"
              })
            )
          );

          const diffInput = document.querySelector("[name='changes']");
          expect(diffInput.value).toEqual(
            JSON.stringify({
              title: "test2"
            })
          );
        });
      });

      describe("with no diff", () => {
        let event;
        let spy;
        beforeEach(() => {
          event = new Event("submit");

          spy = jest.spyOn(event, "preventDefault");

          form.dispatchEvent(event);
        });
        test("nothing happens", () => {
          expect(spy.mock.calls.length).toEqual(1);
        });
      });
    });

    describe("on preview", () => {
      afterEach(() => {
        const previewForm = document.getElementById("preview-form");
        if (previewForm) {
          previewForm.parentNode.removeChild(previewForm);
        }
      });

      test("a form gets created", () => {
        previewButton.dispatchEvent(
          new Event("click", {
            bubbles: true
          })
        );

        expect(document.getElementById("preview-form")).toBeDefined();
      });

      test("the form gets reused and submitted", () => {
        const previewForm = document.createElement("form");
        previewForm.id = "preview-form";

        const previewCsrfInput = document.createElement("input");
        previewCsrfInput.name = "csrf_token";
        previewForm.appendChild(previewCsrfInput);

        const previewStateInput = document.createElement("input");
        previewStateInput.name = "state";
        previewForm.appendChild(previewStateInput);

        const submitFormCb = jest.fn();

        previewForm.addEventListener("submit", submitFormCb);

        document.body.appendChild(previewForm);
        previewButton.dispatchEvent(
          new Event("click", {
            bubbles: true
          })
        );

        expect(previewForm.method).toEqual("post");
        expect(previewForm.action).toEqual("/test/preview");
        expect(previewCsrfInput.type).toEqual("hidden");
        expect(previewCsrfInput.value).toEqual("test");
        expect(previewStateInput.value).toEqual(JSON.stringify(initialState));
        expect(submitFormCb.mock.calls.length).toEqual(1);
      });
    });
  });

  describe("has localStorage", () => {
    const config = {
      form: "market-form"
    };

    const initialState = {
      title: "test",
      snap_name: "test",
      categories: "",
      summary: "Summary",
      description: "Description",
      website: "https://example.com",
      contact: "mailto:test@example.com"
    };

    beforeAll(() => {
      window.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
    });

    beforeEach(() => {
      setupForm(config, initialState);
    });

    afterEach(() => {
      form.parentNode.removeChild(form);
    });

    describe("updateLocalStorage init", () => {
      test("set's the initial state", () => {
        expect(window.localStorage.setItem.mock.calls.length).toEqual(2);
        expect(window.localStorage.setItem.mock.calls[0]).toEqual([
          "test-initial",
          JSON.stringify(initialState)
        ]);
        expect(window.localStorage.setItem.mock.calls[1]).toEqual([
          "test",
          JSON.stringify(initialState)
        ]);
      });
    });
  });

  describe("categories", () => {
    const config = {
      form: "market-form"
    };

    const initialState = {
      title: "test",
      categories: "",
      summary: "Summary",
      description: "Description",
      website: "https://example.com",
      contact: "mailto:test@example.com"
    };

    beforeEach(() => {
      setupForm(config, initialState);
    });

    afterEach(() => {
      form.parentNode.removeChild(form);
    });

    describe("on submit", () => {
      beforeEach(() => {
        primaryCategoryInput.click();
        primaryCategoryInput.options[0].removeAttribute("selected");
        primaryCategoryInput.options[1].selected = "selected";
        primaryCategoryInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        form.dispatchEvent(new Event("submit"));
      });
      test("categories is called", () => {
        expect(categories.categories.mock.calls.length).toEqual(1);
      });
    });
  });
});
