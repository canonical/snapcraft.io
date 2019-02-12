import { initSnapScreenshotsEdit } from "./market/screenshots";
import { updateState, diffState } from "./state";
import { publicMetrics } from "./market/publicMetrics";
import { whitelistBlacklist } from "./market/whitelistBlacklist";
import { initLicenses, license } from "./market/license";
import { categories } from "./market/categories";
import { storageCommands } from "./market/storageCommands";

// https://gist.github.com/dperini/729294
// Luke 07-06-2018 made the protocol optional
const URL_REGEXP = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
// Luke 07-06-2018 rather then looking for a mailto, look for 1 @ and at least 1 .
const MAILTO_REGEXP = /[^@]+@[^@]+\.[^@]+/;

// check if browser is on chromium engine, based on:
// https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
const IS_CHROMIUM =
  window.chrome !== null &&
  typeof window.chrome !== "undefined" &&
  window.navigator.userAgent.indexOf("Edge") === -1; // Edge pretends to have window.chrome

function initSnapIconEdit(iconElId, iconInputId, state) {
  const snapIconInput = document.getElementById(iconInputId);
  const snapIconEl = document.getElementById(iconElId);

  snapIconInput.addEventListener("change", function() {
    const iconFile = this.files[0];
    snapIconEl.src = URL.createObjectURL(iconFile);

    // remove existing icon from state object
    const images = state.images.filter(image => image.type !== "icon");
    // replace it with a new one
    images.unshift({
      url: URL.createObjectURL(iconFile),
      file: iconFile,
      name: iconFile.name,
      status: "new",
      type: "icon"
    });

    updateState(state, { images });
  });

  snapIconEl.addEventListener("click", function() {
    snapIconInput.click();
  });
}

function initFormNotification(formElId, notificationElId) {
  var form = document.getElementById(formElId);

  form.addEventListener("change", function() {
    var notification = document.getElementById(notificationElId);

    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  var notification = document.getElementById(notificationElId);

  if (notification) {
    setTimeout(function() {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 20000);
  }
}

function initForm(config, initialState, errors) {
  // if there are errors focus first error
  if (errors && errors.length) {
    // find input with error or error notification and scroll it into view
    const errorInput =
      document.querySelector(".is-error input") ||
      document.querySelector(".p-notification--negative");

    if (errorInput) {
      errorInput.focus();

      if (errorInput.scrollIntoView) {
        errorInput.scrollIntoView();
      }
    }
  }

  // setup form functionality
  const formEl = document.getElementById(config.form);
  const submitButton = formEl.querySelector(".js-form-submit");
  const revertButton = formEl.querySelector(".js-form-revert");
  const previewButton = formEl.querySelector(".js-listing-preview");
  const revertURL = revertButton.getAttribute("href");
  const disabledRevertClass = "is-disabled";

  function disableSubmit() {
    submitButton.disabled = "disabled";
  }

  function enableSubmit() {
    submitButton.disabled = false;
  }

  function disableRevert() {
    revertButton.setAttribute("href", "javascript:void(0);");
    revertButton.classList.add(disabledRevertClass);
  }

  function enableRevert() {
    revertButton.setAttribute("href", revertURL);
    revertButton.classList.remove(disabledRevertClass);
  }

  // disable submit by default, it will be enabled on valid change
  disableSubmit();
  disableRevert();

  let state = JSON.parse(JSON.stringify(initialState));

  const stateInput = document.createElement("input");
  stateInput.type = "hidden";
  stateInput.name = "state";
  stateInput.value = "";

  formEl.appendChild(stateInput);

  const diffInput = document.createElement("input");
  diffInput.type = "hidden";
  diffInput.name = "changes";
  diffInput.value = "";

  formEl.appendChild(diffInput);

  if (config.snapIconImage && config.snapIconInput) {
    initSnapIconEdit(config.snapIconImage, config.snapIconInput, state);
  }

  initFormNotification(config.form, config.formNotification);

  if (config.screenshotsToolbar && config.screenshotsWrapper) {
    initSnapScreenshotsEdit(
      config.screenshotsToolbar,
      config.screenshotsWrapper,
      state,
      nextState => {
        updateState(state, nextState);
        updateFormState();
      }
    );
  }

  if (config.licenseRadioContent) {
    initLicenses(config.licenseRadioContent);
  }

  let ignoreChangesOnUnload = false;

  window.addEventListener("beforeunload", function(event) {
    const diff = diffState(initialState, state);

    if (!ignoreChangesOnUnload && diff) {
      // crossbrowser beforeunload:
      // https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload

      // confirmation message (ignored by most browsers),
      // but may be showed by some older ones
      var confirmationMessage =
        "Changes that you made will not be saved if you leave the page.";

      event.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34+

      return confirmationMessage; // Gecko, WebKit, Chrome <34
    }

    // make sure to show unload warning dialog during submit in progress
    // but because of Chrome bug don't show it in Chrome:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=152649
    if (!IS_CHROMIUM) {
      ignoreChangesOnUnload = false;
    }
  });

  revertButton.addEventListener("click", () => {
    // make sure we don't warn user about leaving the page when reverting
    ignoreChangesOnUnload = true;
  });

  function checkForm() {
    const diff = diffState(initialState, state);

    if (diff) {
      enableRevert();
      if (isFormValid()) {
        enableSubmit();
      } else {
        disableSubmit();
      }
    } else {
      disableRevert();
    }
  }

  function updateFormState() {
    // Some extra modifications need to happen for the checkboxes
    if (formEl["public_metrics_enabled"]) {
      publicMetrics(formEl);
    }
    if (formEl["territories"]) {
      whitelistBlacklist(formEl);
    }
    if (formEl["license"]) {
      license(formEl);
    }
    if (formEl.elements["primary_category"]) {
      categories(formEl);
    }

    let formData = new FormData(formEl);

    // update state based on data of all inputs
    updateState(state, formData);

    // checkboxes are tricky,
    // make sure to update state based on their 'checked' status
    if (formEl["private"]) {
      updateState(state, {
        private: formEl["private"].value === "private"
      });
    }

    if (formEl["public_metrics_enabled"]) {
      updateState(state, {
        public_metrics_enabled: formEl["public_metrics_enabled"].checked
      });
    }

    checkForm();
    updateLocalStorage();
  }

  function receiveCommands() {
    if (window.localStorage) {
      window.addEventListener("storage", e => {
        storageCommands(e, formEl, state["snap_name"], () => {
          ignoreChangesOnUnload = true;
        });
      });
    }
  }

  function updateLocalStorage() {
    if (!window.localStorage) {
      previewButton.classList.add("u-hide");
      return;
    }
    const key = state["snap_name"];
    window.localStorage.setItem(`${key}-initial`, JSON.stringify(initialState));
    window.localStorage.setItem(key, JSON.stringify(state));
  }

  // when anything is changed update the state
  formEl.addEventListener("change", function() {
    updateFormState();
  });

  formEl.addEventListener("submit", function(event) {
    const diff = diffState(initialState, state);

    // if anything was changed, update state inputs and submit
    if (diff) {
      // TODO: temporary soluton - save clean state in state input,
      // so save still works until backend is update to understand diff
      const cleanState = JSON.parse(JSON.stringify(state));
      if (cleanState.images) {
        cleanState.images = cleanState.images.filter(
          image => image.status !== "delete"
        );
      }

      stateInput.value = JSON.stringify(cleanState);
      diffInput.value = JSON.stringify(diff);

      // make sure we don't warn user about leaving the page when submitting
      ignoreChangesOnUnload = true;

      // disable button and show spinner when loading is long
      disableSubmit();
      setTimeout(() => {
        submitButton.classList.add("has-spinner");
      }, 2000);
    } else {
      updateLocalStorage();
      event.preventDefault();
    }
  });

  // client side validation

  const validation = {};
  const validateInputs = Array.from(formEl.querySelectorAll("input,textarea"));

  function isFormValid() {
    // form is valid if every validated input is valid
    return Object.keys(validation).every(name => validation[name].isValid);
  }

  function validateInput(input) {
    const field = input.closest(".p-form-validation");

    if (field) {
      const message = field.querySelector(".p-form-validation__message");
      if (message) {
        message.remove();
      }

      let isValid = true;
      let showCounter = false;

      const inputValidation = validation[input.name];

      if (inputValidation.required) {
        const length = input.value.length;
        if (!length) {
          isValid = false;
        }
      }

      if (inputValidation.maxLength) {
        const count = validation[input.name].maxLength - input.value.length;

        if (count < 0) {
          inputValidation.counterEl.innerHTML = count;
          isValid = false;
          showCounter = true;
        } else {
          inputValidation.counterEl.innerHTML = "";
          showCounter = false;
        }
      }

      // only validate contents when there is any value
      if (input.value.length > 0) {
        if (inputValidation.mailto) {
          if (
            !URL_REGEXP.test(input.value) &&
            !MAILTO_REGEXP.test(input.value)
          ) {
            isValid = false;
          }
        } else if (inputValidation.url) {
          if (!URL_REGEXP.test(input.value)) {
            isValid = false;
          }
        }
      }

      if (isValid) {
        field.classList.remove("is-error");
        inputValidation.isValid = true;
      } else {
        field.classList.add("is-error");
        inputValidation.isValid = false;
      }

      if (showCounter) {
        field.classList.add("has-counter");
      } else {
        field.classList.remove("has-counter");
      }
    }
  }

  // prepare validation of inputs based on their HTML attributes
  validateInputs.forEach(input => {
    const inputValidation = { isValid: true };

    if (input.maxLength > 0) {
      // save max length, but remove it from input so more chars can be entered
      inputValidation.maxLength = input.maxLength;
      input.removeAttribute("maxlength");

      // prepare counter element to show how many chars need to be removed
      const counter = document.createElement("span");
      counter.className = "p-form-validation__counter";
      inputValidation.counterEl = counter;
      input.parentNode.appendChild(counter);
    }

    if (input.required) {
      inputValidation.required = true;
    }

    if (input.type === "url") {
      inputValidation.url = true;
    }

    // allow mailto: addresses for contact field
    if (input.name === "contact") {
      inputValidation.mailto = true;
    }

    validation[input.name] = inputValidation;
  });

  // validate inputs on change
  formEl.addEventListener("input", function(event) {
    validateInput(event.target);
    updateFormState();
  });

  const openPreview = e => {
    e.preventDefault();
    let form = document.getElementById("preview-form");
    let csrf;
    let input;
    if (!form) {
      form = document.createElement("form");

      csrf = document.createElement("input");
      form.appendChild(csrf);

      input = document.createElement("input");
      form.appendChild(input);

      document.body.appendChild(form);
    } else {
      csrf = form.elements.csrf_token;
      input = form.elements.state;
    }

    form.method = "post";
    form.action = `/${state["snap_name"]}/preview`;
    form.enctype = "multipart/form-data";
    form.className = "u-hide";
    form.target = "_blank";
    form.id = "preview-form";

    csrf.type = "hidden";
    csrf.name = "csrf_token";
    csrf.value = formEl.elements.csrf_token.value;

    input.name = "state";
    input.type = "text";
    input.value = JSON.stringify(state);

    form.dispatchEvent(new Event("submit"));
  };

  previewButton.addEventListener("click", openPreview);

  // Prefix contact and website fields on blur if the user doesn't provide the protocol
  function prefixInput(input) {
    if (["website", "contact"].includes(input.name)) {
      if (
        validation[input.name].isValid &&
        input.value.length > 0 &&
        !input.value.includes("http") &&
        !input.value.includes("mailto")
      ) {
        if (input.name === "website") {
          input.value = `https://${input.value}`;
        } else if (
          input.name === "contact" &&
          MAILTO_REGEXP.test(input.value)
        ) {
          input.value = `mailto:${input.value}`;
        }
        validateInput(input);
        updateFormState();
      }
    }
  }

  const prefixableFields = ["website", "contact"];
  prefixableFields.forEach(inputName => {
    const input = formEl[inputName];
    if (input) {
      input.addEventListener("blur", function(event) {
        prefixInput(event.target);
      });
    }
  });

  receiveCommands();
  updateLocalStorage();
}

export { initSnapIconEdit, initForm };
