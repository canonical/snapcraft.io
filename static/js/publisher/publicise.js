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
  if (checked.length > 0) {
    state.button = checked[0].value;
  }

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

  if (buttonRadios.length > 0) {
    buttonRadios.filter(r => r.value === "black")[0].checked = true;
  }

  // update the frame (but only if it's visible)
  if (previewFrame.offsetParent !== null) {
    previewFrame.src = getCardPath(snapName, getFormState());
    codeElement.innerHTML = getCardEmbedHTML(snapName, getFormState());
  }

  function updateCardSize() {
    // calulate frame height to be a bit bigger then content itself
    // to have some spare room for responsiveness
    if (previewFrame.offsetParent) {
      const height =
        Math.floor(
          (previewFrame.contentWindow.document.body.clientHeight + 10) / 10
        ) * 10;

      if (height !== state.frameHeight) {
        state = {
          ...state,
          frameHeight: height
        };
        // don't re-render the iframe not to trigger load again
        previewFrame.style.height = height + "px";

        if (options.updateHeightCallback) {
          options.updateHeightCallback(height);
        }
        renderCode(state);
      }
    } else {
      renderCode(state);
    }
  }

  previewFrame.addEventListener("load", updateCardSize);
  setInterval(updateCardSize, 1000);

  return () => render(state);
}

// GITHUB BADGES

const getBadgePath = (snapName, badgeName = "badge", showName = true) => {
  return `/${snapName}/${badgeName}.svg${showName ? "" : "?name=0"}`;
};

const getBadgePreview = (snapName, badgeName, showName) => {
  return `<a href="/${snapName}">
  <img alt="${snapName}" src="${getBadgePath(snapName, badgeName, showName)}" />
  </a>`;
};

const getBadgeHTML = (snapName, badgeName, showName) => {
  return `&lt;a href="https://snapcraft.io/${snapName}"&gt;
  &lt;img alt="${snapName}" src="https://snapcraft.io${getBadgePath(
    snapName,
    badgeName,
    showName
  )}" /&gt;
  &lt;/a&gt;`;
};

const getBadgeMarkdown = (snapName, badgeName, showName) => {
  return `[![${snapName}](https://snapcraft.io/${getBadgePath(
    snapName,
    badgeName,
    showName
  )})](https://snapcraft.io/${snapName})`;
};

const getBadgesCode = (snapName, options, badgeGenerator) => {
  const badges = [];
  if (options["show-channel"]) {
    badges.push(badgeGenerator(snapName));
  }
  if (options["show-trending"]) {
    badges.push(badgeGenerator(snapName, "trending", badges.length === 0));
  }
  return badges.join("\n");
};

const getBadgesHTML = (snapName, options) => {
  return getBadgesCode(snapName, options, getBadgeHTML);
};

const getBadgesPreviewHTML = (snapName, options) => {
  return getBadgesCode(snapName, options, getBadgePreview);
};

const getBadgesMarkdown = (snapName, options) => {
  return getBadgesCode(snapName, options, getBadgeMarkdown);
};

function initGitHubBadgePicker(options) {
  const { snapName, htmlElement, previewElement, markdownElement } = options;
  const optionButtons = [].slice.call(options.optionButtons);

  let state = {
    ...getCurrentFormState([], optionButtons)
  };

  const render = state => {
    previewElement.innerHTML = getBadgesPreviewHTML(snapName, state);
    htmlElement.innerHTML = getBadgesHTML(snapName, state);
    markdownElement.innerHTML = getBadgesMarkdown(snapName, state);
  };

  const getFormState = () => {
    return getCurrentFormState([], optionButtons);
  };

  const updateState = () => {
    state = {
      ...state,
      ...getFormState()
    };
    render(state);
  };

  optionButtons.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      updateState();
    });
  });

  render(state);
}

export { initSnapButtonsPicker, initEmbeddedCardPicker, initGitHubBadgePicker };
