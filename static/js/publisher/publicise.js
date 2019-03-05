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

  if (params) {
    params = `?${params}`;
  }

  return `${path}${params}`;
};

const getCardEmbedHTML = (snapName, options) => {
  return `&lt;iframe src="https://snapcraft.io${getCardPath(
    snapName,
    options
  )}" frameborder="0" width="100%" height="320px" style="border: 1px solid" &gt;&lt;/iframe&gt;`;
};

// get form state from inputs
const getCurrentState = (buttonRadios, optionButtons) => {
  var state = {};

  // get state of store button radio
  var checked = buttonRadios.filter(b => b.checked);

  if (checked[0].value) {
    state.button = checked[0].value;
  }

  // get state of options checkboxes
  optionButtons.forEach(checkbox => {
    if (checkbox.checked) {
      state[checkbox.name] = true;
    }
  });

  return state;
};

function initEmbeddedCardPicker(options) {
  const { snapName, previewFrame, codeElement } = options;
  const buttonRadios = [].slice.call(options.buttonRadios);
  const optionButtons = [].slice.call(options.optionButtons);

  const render = () => {
    const state = getCurrentState(buttonRadios, optionButtons);
    previewFrame.src = getCardPath(snapName, state);
    codeElement.innerHTML = getCardEmbedHTML(snapName, state);
  };

  buttonRadios.forEach(radio => {
    radio.addEventListener("change", e => {
      if (e.target.checked) {
        render();
      }
    });
  });

  optionButtons.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      render();
    });
  });

  buttonRadios.filter(r => r.value === "black")[0].checked = true;
  previewFrame.src = getCardPath(
    snapName,
    getCurrentState(buttonRadios, optionButtons)
  );
  codeElement.innerHTML = getCardEmbedHTML(
    snapName,
    getCurrentState(buttonRadios, optionButtons)
  );
}

export { initSnapButtonsPicker, initEmbeddedCardPicker };
