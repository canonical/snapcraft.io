function categories(form: any, state: any) {
  const categoriesList = [];
  if (
    form.elements["primary_category"] &&
    form.elements["primary_category"].value !== ""
  ) {
    categoriesList.push(form.elements["primary_category"].value);

    if (
      form.elements["secondary_category"] &&
      form.elements["secondary_category"].value !== ""
    ) {
      categoriesList.push(form.elements["secondary_category"].value);
    }
  }

  state.categories = categoriesList;
}

function initCategories() {
  const categoryHelpTextEl = document.querySelector(
    ".js-categories-category1-help-text",
  ) as HTMLElement;
  const categorySecondaryAddEl = document.querySelector(
    ".js-categories-category2-add",
  ) as HTMLElement;
  const categorySecondaryPickerEl = document.querySelector(
    ".js-categories-category2-picker",
  ) as HTMLElement;
  const categorySecondaryAddLink = document.querySelector(
    ".js-categories-category2-add-link",
  ) as HTMLElement;
  const secondaryCategoryRemove = document.querySelector(
    ".js-categories-category2-remove",
  ) as HTMLElement;

  const primaryCategorySelectEl = document.querySelector(
    "[name='primary_category']",
  ) as HTMLSelectElement;
  const secondaryCategorySelectEl = document.querySelector(
    "[name='secondary_category']",
  ) as HTMLSelectElement;

  const setSecondaryOptions = () => {
    const primaryValue = primaryCategorySelectEl.value;
    const secondaryValue = secondaryCategorySelectEl.value;
    for (let i = 0; i < secondaryCategorySelectEl.options.length; i++) {
      const option = secondaryCategorySelectEl.options[i];
      if (option.value === primaryValue) {
        option.setAttribute("disabled", "disabled");
        if (secondaryValue === primaryValue) {
          resetSecondaryCategory();
        }
      } else {
        option.removeAttribute("disabled");
      }
    }
  };

  const resetSecondaryCategory = () => {
    secondaryCategorySelectEl.value = "";
    secondaryCategorySelectEl.dispatchEvent(
      new Event("change", { bubbles: true }),
    );
  };

  primaryCategorySelectEl.addEventListener("change", () => {
    const value = primaryCategorySelectEl.value;
    if (value.trim() !== "") {
      categoryHelpTextEl.classList.add("u-hide");
      if (secondaryCategorySelectEl.value === "") {
        categorySecondaryAddEl.classList.remove("u-hide");
        categorySecondaryPickerEl.classList.add("u-hide");
      }
    } else {
      categoryHelpTextEl.classList.remove("u-hide");
      categorySecondaryAddEl.classList.add("u-hide");
      categorySecondaryPickerEl.classList.add("u-hide");
    }
    setSecondaryOptions();
  });

  categorySecondaryAddLink.addEventListener("click", () => {
    categorySecondaryAddEl.classList.add("u-hide");
    categorySecondaryPickerEl.classList.remove("u-hide");
    setSecondaryOptions();
  });

  secondaryCategoryRemove.addEventListener("click", () => {
    resetSecondaryCategory();
    categorySecondaryPickerEl.classList.add("u-hide");
    categorySecondaryAddEl.classList.remove("u-hide");
  });
}

export { categories, initCategories };
