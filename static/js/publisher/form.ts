import { updateState, diffState } from "./state";
import { publicMetrics } from "./market/publicMetrics";
import { whitelistBlacklist } from "./market/whitelistBlacklist";
import { initLicenses, license } from "./market/license";
import { categories } from "./market/categories";
import { storageCommands } from "./market/storageCommands";
import { initMedia } from "./market/initMedia";
import { initIcon } from "./market/initIcon";
import { initBanner } from "./market/initBanner";

// https://gist.github.com/dperini/729294
// Luke 07-06-2018 made the protocol optional
const URL_REGEXP =
  /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
// Luke 07-06-2018 rather then looking for a mailto, look for 1 @ and at least 1 .
const MAILTO_REGEXP = /[^@]+@[^@]+\.[^@]+/;

// check if browser is on chromium engine, based on:
// https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
const IS_CHROMIUM =
  window.chrome !== null &&
  typeof window.chrome !== "undefined" &&
  window.navigator.userAgent.indexOf("Edge") === -1; // Edge pretends to have window.chrome

function initFormNotification(formElId: string, notificationElId: string) {
  var form = document.getElementById(formElId) as HTMLFormElement;

  form.addEventListener("change", function () {
    var notification = document.getElementById(notificationElId);

    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  var notification = document.getElementById(notificationElId);

  if (notification) {
    setTimeout(function () {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 20000);
  }
}

function initForm(
  config: {
    form: string;
    snapIconHolder: any;
    formNotification: string;
    mediaHolder: any;
    bannerHolder: any;
    licenseRadioContent: any;
  },
  initialState: any,
  errors: string | any[] | undefined
) {
  // if there are errors focus first error
  if (errors && errors.length) {
    // find input with error or error notification and scroll it into view
    const errorInput =
      (document.querySelector(".is-error input") as HTMLInputElement) ||
      (document.querySelector(".p-notification--negative") as HTMLInputElement);

    if (errorInput) {
      errorInput.focus();

      if (errorInput.scrollIntoView) {
        const stickyEl = document.querySelector(
          ".snapcraft-p-sticky"
        ) as HTMLElement;
        const stickyHeight = stickyEl.scrollHeight;
        errorInput.scrollIntoView();
        window.scrollBy(0, -(stickyHeight + 16));
      }
    }
  }

  // setup form functionality
  const formEl = document.getElementById(config.form) as any;
  const submitButton = formEl.querySelector(
    ".js-form-submit"
  ) as HTMLButtonElement;
  const revertButton = formEl.querySelector(".js-form-revert") as HTMLElement;
  const previewButton = formEl.querySelector(
    ".js-listing-preview"
  ) as HTMLElement;
  const revertURL = revertButton.getAttribute("href") as string;
  const disabledRevertClass = "is-disabled";

  function disableSubmit() {
    submitButton.disabled = true;
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

  const diffInput = document.createElement("input");
  diffInput.type = "hidden";
  diffInput.name = "changes";
  diffInput.value = "";

  formEl.appendChild(diffInput);

  if (config.snapIconHolder) {
    const icons = state.images.filter(
      (image: { type: string }) => image.type === "icon"
    );
    initIcon(config.snapIconHolder, icons[0], state.title, (newIcon: any) => {
      let noneIcons = state.images.filter(
        (image: { type: string }) => image.type !== "icon"
      );

      if (newIcon) {
        noneIcons = noneIcons.concat([newIcon]);
      }

      const newState = {
        ...state,
        images: noneIcons,
      };

      updateState(state, newState);
      updateFormState();
    });
  }

  initFormNotification(config.form, config.formNotification);

  if (config.mediaHolder) {
    const screenshots = state.images.filter(
      (image: { type: string }) => image.type === "screenshot"
    );
    initMedia(config.mediaHolder, screenshots, (newImages: any) => {
      const noneScreenshots = state.images.filter(
        (item: { type: string }) => item.type !== "screenshot"
      );
      const newState = {
        ...state,
        images: noneScreenshots.concat(newImages),
      };
      updateState(state, newState);
      updateFormState();
    });
  }

  if (config.bannerHolder) {
    let banners = state.images.filter(
      (image: { type: string }) => image.type === "banner"
    );
    initBanner(config.bannerHolder, banners, (image: any) => {
      let newImages = state.images.filter(
        (image: { type: string }) => image.type !== "banner"
      );

      if (image) {
        newImages = newImages.concat([image]);
      }

      const newState = {
        ...state,
        images: newImages,
      };
      updateState(state, newState);
      updateFormState();
    });
  }

  if (config.licenseRadioContent) {
    initLicenses(config.licenseRadioContent);
  }

  let ignoreChangesOnUnload = false;

  window.addEventListener("beforeunload", function (event) {
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

    return "";
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
      disableSubmit();
    }
  }

  function metadata(field: { checked: any }, state: { [x: string]: any }) {
    state["update_metadata_on_release"] = field.checked;
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
      categories(formEl, state);
    }

    if (formEl.elements["update_metadata_on_release"]) {
      metadata(formEl.elements["update_metadata_on_release"], state);
    }

    let formData = new FormData(formEl);

    // update state based on data of all inputs
    updateState(state, formData);

    // checkboxes are tricky,
    // make sure to update state based on their 'checked' status
    if (formEl["private"]) {
      // "private" radio sets both `private` and `unlisted` values
      // if value is:
      //   "public": private is false, unlisted is false
      //   "unlisted": private is false, unlisted is true
      //   "private": private is true, unlisted is false
      updateState(state, {
        private: formEl["private"].value === "private",
        unlisted: formEl["private"].value === "unlisted",
      });
    }

    if (formEl["public_metrics_enabled"]) {
      updateState(state, {
        public_metrics_enabled: formEl["public_metrics_enabled"].checked,
      });
    }

    checkForm();
    updateLocalStorage();
  }

  function receiveCommands() {
    if (window.localStorage) {
      window.addEventListener("storage", (e) => {
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
  formEl.addEventListener("change", function () {
    updateFormState();
  });

  formEl.addEventListener(
    "submit",
    function (event: { preventDefault: () => void }) {
      event.preventDefault();

      const diff = diffState(initialState, state);

      // if anything was changed, update state inputs and submit
      if (diff) {
        diffInput.value = JSON.stringify(diff);

        // make sure we don't warn user about leaving the page when submitting
        ignoreChangesOnUnload = true;

        const updateMetadataModal = document.querySelector(
          ".update-metadata-warning"
        );

        if (updateMetadataModal) {
          updateMetadataModal.classList.remove("u-hide");

          const saveChangesButton = updateMetadataModal.querySelector(
            ".js-save-changes"
          ) as HTMLButtonElement;
          const closeModalButtons =
            updateMetadataModal.querySelectorAll(".js-close-modal");

          closeModalButtons.forEach((closeModalButton: any) => {
            closeModalButton.addEventListener("click", () => {
              updateMetadataModal.classList.add("u-hide");
            });
          });

          saveChangesButton.addEventListener("click", () => {
            updateMetadataModal.classList.add("u-hide");
            disableSubmit();
            submitButton.classList.add("has-spinner");
            setTimeout(() => {
              formEl.submit();
            }, 2000);
          });
        } else {
          disableSubmit();
          submitButton.classList.add("has-spinner");
          setTimeout(() => {
            formEl.submit();
          }, 2000);
        }
      } else {
        updateLocalStorage();
      }
    }
  );

  // client side validation

  const validation: { [key: string]: any } = {};
  const validateInputs = Array.from(formEl.querySelectorAll("input,textarea"));

  function isFormValid() {
    // form is valid if every validated input is valid
    return Object.keys(validation).every(
      (name: any) => validation[name].isValid
    );
  }

  function validateInput(input: any) {
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
        if (validation[input.name].maxLength === input.value.length) {
          inputValidation.counterEl.innerHTML = `The maximum number of characters for this field is ${
            validation[input.name].maxLength
          }.`;
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
  validateInputs.forEach((input: any) => {
    const inputValidation: any = { isValid: true };

    if (input.maxLength > 0) {
      // save max length, but remove it from input so more chars can be entered
      inputValidation.maxLength = input.maxLength;

      // prepare counter element to show how many chars need to be removed
      const counter = document.createElement("p");
      counter.className = "p-form-help-text";
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
  formEl.addEventListener("input", function (event: { target: any }) {
    validateInput(event.target);
    updateFormState();
  });

  const previewForm = document.getElementById("preview-form") as any;
  const openPreview = () => {
    const stateInput = previewForm.elements.state;
    stateInput.value = JSON.stringify(state);
  };

  if (previewForm) {
    previewForm.addEventListener("submit", openPreview);
  }

  // Prefix contact and website fields on blur if the user doesn't provide the protocol
  function prefixInput(input: any) {
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
  prefixableFields.forEach((inputName: any) => {
    const input = formEl[inputName];
    if (input) {
      input.addEventListener(
        "blur",
        function (event: { target: EventTarget | null }) {
          prefixInput(event.target);
        }
      );
    }
  });

  receiveCommands();
  updateLocalStorage();
}

export { initForm };
