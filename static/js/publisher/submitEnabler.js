import shallowDiff from "../libs/shallowDiff";

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

  const initialState = new FormData(formEl);

  const initialStateJson = {};

  let key, value;
  for ([key, value] of initialState.entries()) {
    initialStateJson[key] = value;
  }

  buttonEls.forEach(button => {
    if (button) {
      button.setAttribute("disabled", "disabled");
      button.classList.add("is--disabled");
    }
  });

  formEl.addEventListener("change", () => {
    const newState = new FormData(formEl);
    const newStateJson = {};

    let key, value;
    for ([key, value] of newState.entries()) {
      newStateJson[key] = value;
    }

    const diff = shallowDiff(initialStateJson, newStateJson);
    buttonEls.forEach(button => {
      if (diff) {
        button.removeAttribute("disabled");
        button.classList.remove("is--disabled");
      } else {
        button.setAttribute("disabled", "disabled");
        button.classList.add("is--disabled");
      }
    });
  });
}

export { submitEnabler as default };
