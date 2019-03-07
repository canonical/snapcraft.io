// SNAP STORE BUTTONS

function initSnapButtonsPicker() {
  const languagePicker = document.querySelector(".js-language-select");

  function showLanguage(language) {
    const open = document.querySelector("#" + language + "_content");

    const notHidden = document.querySelector(
      ".js-language-content:not(.u-hide)"
    );
    if (notHidden) {
      notHidden.classList.add("u-hide");
    }
    if (open) {
      open.classList.remove("u-hide");
    }
  }

  let checked = document.querySelector("[name='language']:checked");

  if (!checked) {
    checked = document.querySelector("[name='language']");
    checked.setAttribute("checked", "checked");
  }

  if (checked) {
    showLanguage(checked.value);
  }

  if (languagePicker) {
    languagePicker.addEventListener("change", function() {
      showLanguage(this.elements["language"].value);
    });
  }
}

// EMBEDDABLE CARDS

const getCardPath = (snapName, options = {}) => {
  const path = `/${snapName}/embedded`;
  let params = "";

  if (options.button) {
    params = `button=${options.button}`;
  }

  if (options["show-summary"]) {
    if (params) {
      params = `${params}&`;
    }

    params += `summary=true`;
  }

  if (options["show-screenshot"]) {
    if (params) {
      params = `${params}&`;
    }

    params += `screenshot=true`;
  }

  if (params) {
    params = `?${params}`;
  }

  return `${path}${params}`;
};

const getCardEmbedHTML = (snapName, options) => {
  return `&lt;iframe src="https://snapcraft.io${getCardPath(
    snapName,
    options
  )}" frameborder="0" width="100%" height="${
    options.frameHeight
  }px" style="border: 1px solid #CCC; border-radius: 2px;"&gt;&lt;/iframe&gt;`;
};

// get form state from inputs
const getCurrentFormState = (buttonRadios, optionButtons) => {
  var state = {};

  // get state of store button radio
  var checked = buttonRadios.filter(b => b.checked);
  state.button = checked[0].value;

  // get state of options checkboxes
  optionButtons.forEach(checkbox => {
    state[checkbox.name] = checkbox.checked;
  });

  return state;
};

function initEmbeddedCardPicker(options) {
  const { snapName, previewFrame, codeElement } = options;
  const buttonRadios = [].slice.call(options.buttonRadios);
  const optionButtons = [].slice.call(options.optionButtons);
  let state = {
    ...getCurrentFormState(buttonRadios, optionButtons),
    frameHeight: 320
  };

  const renderCode = state => {
    codeElement.innerHTML = getCardEmbedHTML(snapName, state);
  };

  const render = state => {
    previewFrame.src = getCardPath(snapName, state);
    renderCode(state);
  };

  buttonRadios.forEach(radio => {
    radio.addEventListener("change", e => {
      if (e.target.checked) {
        state = {
          ...state,
          ...getCurrentFormState(buttonRadios, optionButtons)
        };
        render(state);
      }
    });
  });

  optionButtons.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      state = {
        ...state,
        ...getCurrentFormState(buttonRadios, optionButtons)
      };
      render(state);
    });
  });

  buttonRadios.filter(r => r.value === "black")[0].checked = true;
  previewFrame.src = getCardPath(
    snapName,
    getCurrentFormState(buttonRadios, optionButtons)
  );
  codeElement.innerHTML = getCardEmbedHTML(
    snapName,
    getCurrentFormState(buttonRadios, optionButtons)
  );

  previewFrame.addEventListener("load", function() {
    // calulate frame height to be a bit bigger then content itself
    // to have some spare room for responsiveness
    const height =
      Math.floor(
        (previewFrame.contentWindow.document.body.scrollHeight + 20) / 10
      ) * 10;

    state = {
      ...state,
      frameHeight: height
    };
    // don't re-render the iframe not to trigger load again
    previewFrame.style.height = height + "px";
    renderCode(state);
  });
}

export { initSnapButtonsPicker, initEmbeddedCardPicker };
