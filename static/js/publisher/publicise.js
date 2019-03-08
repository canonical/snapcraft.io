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
  let params = [];

  if (options.button) {
    params.push(`button=${options.button}`);
  }

  if (options["show-channels"]) {
    params.push(`channels=true`);
  }

  if (options["show-summary"]) {
    params.push(`summary=true`);
  }

  if (options["show-screenshot"]) {
    params.push(`screenshot=true`);
  }

  if (params.length) {
    params = `?${params.join("&")}`;
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
  const state = {};

  // get state of store button radio
  let checked = buttonRadios.filter(b => b.checked);
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

  const getFormState = () => {
    return getCurrentFormState(buttonRadios, optionButtons);
  };

  const updateState = () => {
    state = {
      ...state,
      ...getFormState()
    };
    render(state);
  };

  buttonRadios.forEach(radio => {
    radio.addEventListener("change", e => {
      if (e.target.checked) {
        updateState();
      }
    });
  });

  optionButtons.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      updateState();
    });
  });

  buttonRadios.filter(r => r.value === "black")[0].checked = true;
  previewFrame.src = getCardPath(snapName, getFormState());
  codeElement.innerHTML = getCardEmbedHTML(snapName, getFormState());

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
