function submitEnabler(formSelector, buttonSelectors) {
  if (!formSelector) {
    throw new TypeError("`formSelector` argument is required");
  }

  if (!buttonSelectors || buttonSelectors.length === 0) {
    throw new TypeError("At least one `buttonSelectors` must be defined");
  }

  const formEl = document.querySelector(formSelector);

  if (!formEl) {
    throw new Error(`${formSelector} is not a valid element`);
  }

  const buttonEls = buttonSelectors.map(selector =>
    document.querySelector(selector)
  );

  buttonEls.forEach(button => {
    if (button) {
      button.setAttribute("disabled", "disabled");
      button.classList.add("is--disabled");
    }
  });

  formEl.addEventListener("change", () => {
    buttonEls.forEach(button => {
      button.removeAttribute("disabled");
      button.classList.remove("is--disabled");
    });
  });
}

export { submitEnabler as default };
