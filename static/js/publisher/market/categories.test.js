import * as categories from "./categories";

describe("categories", () => {
  let form;
  let cat1Input;
  let cat2Input;
  let state;

  beforeEach(() => {
    form = document.createElement("form");

    cat1Input = document.createElement("input");
    cat1Input.name = "primary_category";
    cat1Input.type = "text";
    cat1Input.value = "";

    cat2Input = document.createElement("input");
    cat2Input.name = "secondary_category";
    cat2Input.type = "text";
    cat2Input.value = "";

    state = {};

    form.appendChild(cat1Input);
    form.appendChild(cat2Input);

    document.body.appendChild(form);
  });

  afterEach(() => {
    document.body.removeChild(form);
  });

  test("given a primary category, return that value", () => {
    cat1Input.value = "test";
    categories.categories(form, state);
    expect(state).toEqual({ categories: ["test"] });
  });

  test("given a primary and secondary category, return those values", () => {
    cat1Input.value = "test";
    cat2Input.value = "test2";
    categories.categories(form, state);
    expect(state).toEqual({ categories: ["test", "test2"] });
  });
});

describe("initCategories", () => {
  let holder;
  let categoryHelpTextEl;
  let categorySecondaryAddEl;
  let categorySecondaryPickerEl;
  let categorySecondaryAddLink;
  let secondaryCategoryRemove;
  let primaryCategorySelectEl;
  let secondaryCategorySelectEl;

  const categoryOptions = ["", "test1", "test2", "test3"];

  let cb;

  beforeEach(() => {
    categoryHelpTextEl = document.createElement("div");
    categoryHelpTextEl.className = "js-categories-category1-help-text";

    categorySecondaryAddEl = document.createElement("div");
    categorySecondaryAddEl.className = "js-categories-category2-add";

    categorySecondaryPickerEl = document.createElement("div");
    categorySecondaryPickerEl.className = "js-categories-category2-picker";

    categorySecondaryAddLink = document.createElement("div");
    categorySecondaryAddLink.className = "js-categories-category2-add-link";

    secondaryCategoryRemove = document.createElement("div");
    secondaryCategoryRemove.className = "js-categories-category2-remove";

    primaryCategorySelectEl = document.createElement("select");
    primaryCategorySelectEl.name = "primary_category";
    primaryCategorySelectEl.value = "";

    secondaryCategorySelectEl = document.createElement("select");
    secondaryCategorySelectEl.name = "secondary_category";
    secondaryCategorySelectEl.value = "";

    categoryOptions.forEach((category, index) => {
      const option1 = document.createElement("option");
      const option2 = document.createElement("option");
      option1.value = category;
      option2.value = category;
      if (index === 0) {
        option1.selected = "selected";
        option2.selected = "selected";
      }
      primaryCategorySelectEl.appendChild(option1);
      secondaryCategorySelectEl.appendChild(option2);
    });

    cb = jest.fn();
    secondaryCategorySelectEl.addEventListener("change", cb);

    holder = document.createElement("div");
    holder.appendChild(categoryHelpTextEl);
    holder.appendChild(categorySecondaryAddEl);
    holder.appendChild(categorySecondaryPickerEl);
    holder.appendChild(categorySecondaryAddLink);
    holder.appendChild(secondaryCategoryRemove);
    holder.appendChild(primaryCategorySelectEl);
    holder.appendChild(secondaryCategorySelectEl);
    document.body.appendChild(holder);

    categories.initCategories();
  });

  afterEach(() => {
    document.body.removeChild(holder);
  });

  describe("changing primary category without a secondary category", () => {
    beforeEach(() => {
      primaryCategorySelectEl.options[0].removeAttribute("selected");
      primaryCategorySelectEl.options[1].selected = "selected";
      primaryCategorySelectEl.dispatchEvent(new Event("change"));
    });

    test("hides the help text", () => {
      expect(categoryHelpTextEl.classList.contains("u-hide")).toEqual(true);
    });

    test("shows the secondary add prompty", () => {
      expect(categorySecondaryAddEl.classList.contains("u-hide")).toEqual(
        false
      );
    });

    test("hides the secondary category selector", () => {
      expect(categorySecondaryPickerEl.classList.contains("u-hide")).toEqual(
        true
      );
    });

    test("secondary selector option is disabled", () => {
      expect(secondaryCategorySelectEl.options[1].disabled).toEqual(true);
    });
  });

  describe("removing primary category", () => {
    beforeEach(() => {
      primaryCategorySelectEl.options[1].removeAttribute("selected");
      primaryCategorySelectEl.options[0].selected = "selected";
      primaryCategorySelectEl.dispatchEvent(new Event("change"));
    });

    test("shows the help text", () => {
      expect(categoryHelpTextEl.classList.contains("u-hide")).toEqual(false);
    });

    test("hides the secondary add prompt", () => {
      expect(categorySecondaryAddEl.classList.contains("u-hide")).toEqual(true);
    });

    test("hides the secondary category selector", () => {
      expect(categorySecondaryPickerEl.classList.contains("u-hide")).toEqual(
        true
      );
    });

    test("secondary selector option is disabled", () => {
      expect(secondaryCategorySelectEl.options[0].disabled).toEqual(true);
    });

    test("expect secondary category change event to be triggered", () => {
      expect(cb.mock.calls.length).toBe(1);
    });
  });

  describe("add second category", () => {
    beforeEach(() => {
      categorySecondaryAddLink.dispatchEvent(new Event("click"));
    });

    test("hides the secondary add prompt", () => {
      expect(categorySecondaryAddEl.classList.contains("u-hide")).toEqual(true);
    });

    test("shows the secondary category selector", () => {
      expect(categorySecondaryPickerEl.classList.contains("u-hide")).toEqual(
        false
      );
    });

    test("secondary selector option is disabled", () => {
      expect(secondaryCategorySelectEl.options[0].disabled).toEqual(true);
    });
  });

  describe("remove secondary category", () => {
    beforeEach(() => {
      secondaryCategoryRemove.dispatchEvent(new Event("click"));
    });

    test("shows the secondary add prompt", () => {
      expect(categorySecondaryAddEl.classList.contains("u-hide")).toEqual(
        false
      );
    });

    test("hides the secondary category selector", () => {
      expect(categorySecondaryPickerEl.classList.contains("u-hide")).toEqual(
        true
      );
    });

    test("expect secondary category change event to be triggered", () => {
      expect(cb.mock.calls.length).toBe(1);
    });
  });
});
