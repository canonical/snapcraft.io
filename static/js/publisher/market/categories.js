function categories(form, state) {
  let categoriesList = [];
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
    ".js-categories-category1-help-text"
  );
  const categorySecondaryAddEl = document.querySelector(
    ".js-categories-category2-add"
  );
  const categorySecondaryPickerEl = document.querySelector(
    ".js-categories-category2-picker"
  );
  const categorySecondaryAddLink = document.querySelector(
    ".js-categories-category2-add-link"
  );
  const secondaryCategoryRemove = document.querySelector(
    ".js-categories-category2-remove"
  );

  const primaryCategorySelectEl = document.querySelector(
    "[name='primary_category']"
  );
  const secondaryCategorySelectEl = document.querySelector(
    "[name='secondary_category']"
  );

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
      new Event("change", { bubbles: true })
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
