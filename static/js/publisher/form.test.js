import * as market from "./form";
import * as categories from "./market/categories";

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
  let previewForm;
  let previewStateInput;

  const categoriesList = ["", "test1", "test2"];

  function setupForm(config, initialState) {
    form = document.createElement("form");
    form.id = config.form;

    submitButton = document.createElement("button");
    submitButton.classList.add("js-form-submit");

    revertButton = document.createElement("a");
    revertButton.classList.add("js-form-revert");
    revertButton.href = "/test";

    previewButton = document.createElement("button");
    previewButton.classList.add("js-listing-preview");
    previewButton.setAttribute("form", "preview-form");

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

    previewForm = document.createElement("form");
    previewForm.id = "preview-form";
    previewStateInput = document.createElement("input");
    previewStateInput.name = "state";
    previewStateInput.value = JSON.stringify(initialState);
    previewForm.appendChild(previewStateInput);
    document.body.appendChild(previewForm);

    market.initForm(config, initialState, undefined);
  }

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
    contact: "mailto:test@example.com",
    images: []
  };

  beforeEach(() => {
    setupForm(config, initialState);
  });

  afterEach(() => {
    form.parentNode.removeChild(form);
  });

  test("should create diff input", () => {
    const diffInput = document.querySelector("[name='changes']");
    expect(diffInput.value).toEqual("");
  });

  test("should disable the submit button", () => {
    expect(submitButton.getAttribute("disabled")).toEqual("");
  });

  test("should disable the revert button", () => {
    expect(revertButton.classList.contains("is--disabled")).toEqual(true);
    expect(revertButton.href).toEqual("javascript:void(0);");
  });

  describe("on title change", () => {
    beforeEach(() => {
      titleInput.click();
      titleInput.value = "test2";
      titleInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    test("should enable save button", () => {
      expect(submitButton.getAttribute("disabled")).toBeNull();
    });

    test("should enable revert button", () => {
      expect(revertButton.classList.contains("is--disabled")).toEqual(false);
      expect(revertButton.getAttribute("href")).toEqual("/test");
    });
  });

  describe("on submit", () => {
    describe("with diffs", () => {
      test("should update state and diff", () => {
        titleInput.click();
        titleInput.value = "test3";
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));

        form.dispatchEvent(new Event("submit"));

        const stateInput = document.querySelector("[name='state']");
        expect(stateInput.value).toEqual(
          JSON.stringify(
            Object.assign(initialState, {
              title: "test"
            })
          )
        );

        const diffInput = document.querySelector("[name='changes']");
        expect(diffInput.value).toEqual(
          JSON.stringify({
            title: "test3",
            categories: ""
          })
        );
      });
    });

    describe("with no diff", () => {
      test("should not submit", () => {
        const event = new Event("submit");
        const spy = jest.spyOn(event, "preventDefault");

        form.dispatchEvent(event);

        expect(spy.mock.calls.length).toEqual(1);
      });
    });
  });

  describe("on preview", () => {
    test("should update the state", () => {
      previewButton.dispatchEvent(
        new Event("click", {
          bubbles: true
        })
      );

      expect(JSON.parse(previewStateInput.value)).toEqual(initialState);
    });
  });

  describe("has localStorage", () => {
    describe("updateLocalStorage init", () => {
      test("should set the initial state", () => {
        expect(window.localStorage.getItem("test-initial")).toEqual(
          JSON.stringify(initialState)
        );
        expect(window.localStorage.getItem("test")).toEqual(
          JSON.stringify(initialState)
        );
      });
    });
  });

  describe("categories", () => {
    describe("on submit", () => {
      beforeEach(() => {
        jest.spyOn(categories, "categories");
        primaryCategoryInput.click();
        primaryCategoryInput.options[0].removeAttribute("selected");
        primaryCategoryInput.options[1].selected = "selected";
        primaryCategoryInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        form.dispatchEvent(new Event("submit"));
      });
      test("should call categories function", () => {
        expect(categories.categories.mock.calls.length).toEqual(1);
      });
    });
  });
});
