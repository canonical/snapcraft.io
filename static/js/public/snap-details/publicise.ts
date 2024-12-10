// SNAP STORE BUTTONS

function initSnapButtonsPicker() {
  const languagePicker = document.querySelector(".js-language-select");

  function showLanguage(language: string) {
    const open = document.querySelector("#" + language + "_content");

    const notHidden = document.querySelector(
      ".js-language-content:not(.u-hide)",
    );
    if (notHidden) {
      notHidden.classList.add("u-hide");
    }
    if (open) {
      open.classList.remove("u-hide");
    }
  }

  let checked = document.querySelector(
    "[name='language']:checked",
  ) as HTMLInputElement;

  if (!checked) {
    checked = document.querySelector("[name='language']") as HTMLInputElement;
    checked.setAttribute("checked", "checked");
  }

  if (checked) {
    showLanguage(checked.value);
  }

  if (languagePicker) {
    languagePicker.addEventListener("change", function () {
      // @ts-ignore
      showLanguage(this.elements["language"].value);
    });
  }
}

// EMBEDDABLE CARDS

const getCardPath = (snapName: any, options: { [key: string]: any } = {}) => {
  const path = `/${snapName}/embedded`;
  const params: Array<string> = [];
  let paramsString: string = "";

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
    paramsString = `?${params.join("&")}`;
  }

  return `${path}${paramsString}`;
};

const getCardEmbedHTML = (snapName: any, options: { [key: string]: any }) => {
  return `&lt;iframe src="https://snapcraft.io${getCardPath(
    snapName,
    options,
  )}" frameborder="0" width="100%" height="${
    options.frameHeight
  }px" style="border: 1px solid #CCC; border-radius: 2px;"&gt;&lt;/iframe&gt;`;
};

// get form state from inputs
const getCurrentFormState = (buttonRadios: any[], optionButtons: any[]) => {
  const state: { [key: string]: any } = {};

  // get state of store button radio
  const checked = buttonRadios.filter((b) => b.checked);
  if (checked.length > 0) {
    state.button = checked[0].value;
  }

  // get state of options checkboxes
  optionButtons.forEach((checkbox) => {
    state[checkbox.name] = checkbox.checked;
  });

  return state;
};

function initEmbeddedCardPicker(options: {
  snapName?: string;
  previewFrame?: any;
  codeElement?: any;
  buttonRadios?: any;
  optionButtons?: any;
  updateHeightCallback?: any;
}) {
  const { snapName, previewFrame, codeElement } = options;
  const buttonRadios: Array<HTMLInputElement> = [].slice.call(
    options.buttonRadios,
  );
  const optionButtons = [].slice.call(options.optionButtons);

  let state = {
    ...getCurrentFormState(buttonRadios, optionButtons),
    frameHeight: 320,
  };

  const renderCode = (state: { [x: string]: any; frameHeight?: number }) => {
    codeElement.innerHTML = getCardEmbedHTML(snapName, state);
  };

  const render = (state: { [key: string]: any }) => {
    previewFrame.src = getCardPath(snapName, state);
    renderCode(state);
  };

  const getFormState = () => {
    return getCurrentFormState(buttonRadios, optionButtons);
  };

  const updateState = () => {
    state = {
      ...state,
      ...getFormState(),
    };
    render(state);
  };

  buttonRadios.forEach((radio: HTMLInputElement) => {
    radio.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        updateState();
      }
    });
  });

  optionButtons.forEach((checkbox: HTMLInputElement) => {
    checkbox.addEventListener("change", () => {
      updateState();
    });
  });

  if (buttonRadios.length > 0) {
    buttonRadios.filter((r: any) => r.value === "black")[0].checked = true;
  }

  // update the frame (but only if it's visible)
  if (previewFrame.offsetParent !== null) {
    previewFrame.src = getCardPath(snapName, getFormState());
    codeElement.innerHTML = getCardEmbedHTML(snapName, getFormState());
  }

  function updateCardSize() {
    // calulate frame height to be a bit bigger then content itself
    // to have some spare room for responsiveness
    if (previewFrame.offsetParent && previewFrame.contentWindow.document.body) {
      const height =
        Math.floor(
          (previewFrame.contentWindow.document.body.clientHeight + 20) / 10,
        ) * 10;

      if (height !== state.frameHeight) {
        state = {
          ...state,
          frameHeight: height,
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

const getBadgePath = (
  snapName: any,
  badgeName = "badge",
  showName = true,
  isPreview = false,
) => {
  const params = [];
  if (!showName) {
    params.push("name=0");
  }

  if (isPreview) {
    params.push("preview=1");
  }

  return `/${snapName}/${badgeName}.svg${
    params.length ? `?${params.join("&")}` : ""
  }`;
};

const getBadgePreview = (
  snapName: any,
  badgeName: string | undefined,
  showName: boolean | undefined,
) => {
  return `<a href="/${snapName}">
  <img alt="${snapName}" src="${getBadgePath(
    snapName,
    badgeName,
    showName,
    badgeName === "trending",
  )}" />
  </a>`;
};

const getBadgeHTML = (
  snapName: any,
  badgeName: string | undefined,
  showName: boolean | undefined,
) => {
  return `&lt;a href="https://snapcraft.io/${snapName}"&gt;
  &lt;img alt="${snapName}" src="https://snapcraft.io${getBadgePath(
    snapName,
    badgeName,
    showName,
  )}" /&gt;
&lt;/a&gt;`;
};

const getBadgeMarkdown = (
  snapName: any,
  badgeName: string | undefined,
  showName: boolean | undefined,
) => {
  return `[![${snapName}](https://snapcraft.io${getBadgePath(
    snapName,
    badgeName,
    showName,
  )})](https://snapcraft.io/${snapName})`;
};

const getBadgesCode = (snapName: any, options: any, badgeGenerator: any) => {
  const badges = [];
  if (options["show-channel"]) {
    badges.push(badgeGenerator(snapName));
  }
  if (options["show-trending"]) {
    badges.push(badgeGenerator(snapName, "trending", badges.length === 0));
  }
  return badges.join("\n");
};

const getBadgesHTML = (snapName: any, options: any) => {
  return getBadgesCode(snapName, options, getBadgeHTML);
};

const getBadgesPreviewHTML = (snapName: any, options: any) => {
  return getBadgesCode(snapName, options, getBadgePreview);
};

const getBadgesMarkdown = (snapName: any, options: any) => {
  return getBadgesCode(snapName, options, getBadgeMarkdown);
};

function initGitHubBadgePicker(options: {
  optionButtons?: any;
  snapName?: any;
  htmlElement?: any;
  previewElement?: any;
  markdownElement?: any;
  notificationElement?: any;
  badgeCodeElement?: any;
  optionsUncheckedElement?: any;
  isTrending?: any;
}) {
  const {
    snapName,
    htmlElement,
    previewElement,
    markdownElement,
    notificationElement,
    badgeCodeElement,
    optionsUncheckedElement,
    isTrending,
  } = options;
  const optionButtons = [].slice.call(options.optionButtons);

  let state = {
    ...getCurrentFormState([], optionButtons),
  };

  const render = (state: { [x: string]: any }) => {
    if (state["show-trending"] && !isTrending) {
      notificationElement.classList.remove("u-hide");
    } else {
      notificationElement.classList.add("u-hide");
    }

    if (state["show-channel"] || state["show-trending"]) {
      optionsUncheckedElement.classList.add("u-hide");
      badgeCodeElement.classList.remove("u-hide");
    } else {
      optionsUncheckedElement.classList.remove("u-hide");
      badgeCodeElement.classList.add("u-hide");
    }

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
      ...getFormState(),
    };
    render(state);
  };

  optionButtons.forEach((checkbox: HTMLInputElement) => {
    checkbox.addEventListener("change", () => {
      updateState();
    });
  });

  render(state);
}

export { initSnapButtonsPicker, initEmbeddedCardPicker, initGitHubBadgePicker };
