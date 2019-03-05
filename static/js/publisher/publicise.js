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

const getCardPath = (snapName, button) => {
  const path = `/${snapName}/embedded`;
  let params = "";

  if (button) {
    params = `button=${button}`;
  }

  if (params) {
    params = `?${params}`;
  }

  return `${path}${params}`;
};

const getCardEmbedHTML = (snapName, button) => {
  return `&lt;iframe src="https://snapcraft.io${getCardPath(
    snapName,
    button
  )}" frameborder="0" width="100%" height="320px" style="border: 1px solid" &gt;&lt;/iframe&gt;`;
};

function initEmbeddedCardPicker(options) {
  const { snapName, previewFrame, codeElement } = options;
  const buttonRadios = [].slice.call(options.buttonRadios);

  buttonRadios.forEach(radio => {
    radio.addEventListener("change", e => {
      if (e.target.checked) {
        var buttonValue = e.target.value;
        previewFrame.src = getCardPath(snapName, buttonValue);
        codeElement.innerHTML = getCardEmbedHTML(snapName, buttonValue);
      }
    });
  });

  buttonRadios.filter(r => r.value === "black")[0].checked = true;
  previewFrame.src = getCardPath(snapName, "black");
  codeElement.innerHTML = getCardEmbedHTML(snapName, "black");
}

export { initSnapButtonsPicker, initEmbeddedCardPicker };
