import { initSnapScreenshotsEdit } from './screenshots';
import { updateState, diffState } from './state';
import { publicMetrics } from './publicMetrics';

// https://gist.github.com/dperini/729294
const URL_REGEXP = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
const MAILTO_REGEXP = /^mailto:/;

function initSnapIconEdit(iconElId, iconInputId, state) {
  const snapIconInput = document.getElementById(iconInputId);
  const snapIconEl = document.getElementById(iconElId);

  snapIconInput.addEventListener("change", function(){
    const iconFile = this.files[0];
    snapIconEl.src = URL.createObjectURL(iconFile);

    // remove existing icon from state object
    const images = state.images.filter(image => image.type !== 'icon');
    // replace it with a new one
    images.unshift({
      url: URL.createObjectURL(iconFile),
      file: iconFile,
      name: iconFile.name,
      status: 'new'
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
    setTimeout(function(){
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
    const errorInput = document.querySelector('.is-error input')
      || document.querySelector('.p-notification--negative');

    if (errorInput) {
      errorInput.focus();

      if (errorInput.scrollIntoView) {
        errorInput.scrollIntoView();
      }
    }
  }

  // setup form functionality
  const marketForm = document.getElementById(config.form);
  let state = JSON.parse(JSON.stringify(initialState));

  const stateInput = document.createElement('input');
  stateInput.type = "hidden";
  stateInput.name = "state";

  marketForm.appendChild(stateInput);

  const diffInput = document.createElement('input');
  diffInput.type = "hidden";
  diffInput.name = "changes";

  marketForm.appendChild(diffInput);

  initSnapIconEdit(config.snapIconImage, config.snapIconInput, state);
  initFormNotification(config.form, config.formNotification);
  initSnapScreenshotsEdit(
    config.screenshotsToolbar,
    config.screenshotsWrapper,
    state
  );

  // when anything is changed update the state
  marketForm.addEventListener('change', function() {
    let formData = new FormData(marketForm);

    // Some extra modifications need to happen for the checkboxes
    publicMetrics(marketForm, formData);
    updateState(state, formData);
  });

  marketForm.addEventListener('submit', function(event) {
    const diff = diffState(initialState, state);

    // if anything was changed, update state inputs and submit
    if (diff) {
    // TODO: temporary soluton - save clean state in state input,
    // so save still works until backend is update to understand diff
      const cleanState = JSON.parse(JSON.stringify(state));
      cleanState.images = cleanState.images.filter(image => image.status !== 'delete');
      stateInput.value = JSON.stringify(cleanState);
      diffInput.value = JSON.stringify(diff);
    } else {
      event.preventDefault();
    }
  });

  // client side validation

  const validation = {};
  const validateInputs = Array.from(marketForm.querySelectorAll('input'));

  validateInputs.forEach(input => {
    const inputValidation = {};

    if (input.maxLength > 0) {
      // save max length, but remove it from input so more chars can be entered
      inputValidation.maxLength = input.maxLength;
      input.removeAttribute('maxlength');

      // prepare counter element to show how many chars need to be removed
      const counter = document.createElement('span');
      counter.className = 'p-form-validation__counter';
      inputValidation.counterEl = counter;
      input.parentNode.appendChild(counter);
    }

    if (input.required) {
      inputValidation.required = true;
    }

    if (input.type === 'url') {
      inputValidation.url = true;
    }

    // allow mailto: addresses for contact field
    if (input.name === 'contact') {
      inputValidation.mailto = true;
    }

    validation[input.name] = inputValidation;
  });

  // validate inputs on change
  marketForm.addEventListener('input', function (event) {
    const input = event.target;
    const field = input.closest('.p-form-validation');

    if (field) {
      const message = field.querySelector('.p-form-validation__message');
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
          inputValidation.counterEl.innerHTML = '';
          showCounter = false;
        }
      }

      // only validate contents when there is any value
      if (input.value.length > 0) {
        if (inputValidation.mailto) {
          if (!URL_REGEXP.test(input.value) && !MAILTO_REGEXP.test(input.value)) {
            isValid = false;
          }
        } else if (inputValidation.url) {
          if (!URL_REGEXP.test(input.value)) {
            isValid = false;
          }
        }
      }

      if (isValid) {
        field.classList.remove('is-error');
      } else {
        field.classList.add('is-error');
      }

      if (showCounter) {
        field.classList.add('has-counter');
      } else {
        field.classList.remove('has-counter');
      }
    }

  });
}

export {
  initSnapIconEdit,
  initFormNotification,
  initSnapScreenshotsEdit,
  initForm
};
