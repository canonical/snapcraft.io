import { initSnapScreenshotsEdit } from './screenshots';

function initSnapIconEdit(iconElId, iconInputId) {
  const snapIconInput = document.getElementById(iconInputId);
  const snapIconEl = document.getElementById(iconElId);

  snapIconInput.addEventListener("change", function(){
    const fileList = this.files;
    snapIconEl.src = URL.createObjectURL(fileList[0]);
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

const allowedKeys = ['title', 'summary', 'description', 'images', 'website', 'contact'];

// TODO: test
function diffFormData(initialState, state) {
  const diff = {};

  for (let key of allowedKeys) {
    // images is an array of objects so compare stringified version
    if (key === 'images') {
      // remove images to delete from the diff
      const images = state[key].filter(image => image.status !== 'delete');

      if (JSON.stringify(initialState[key]) !== JSON.stringify(images)) {
        diff[key] = images;
      }
    } else {
      if (initialState[key] !== state[key]) {
        diff[key] = state[key];
      }
    }
  }

  // only return diff when there are any changes
  return Object.keys(diff).length > 0 ? diff : null;
}

function updateState(state, values) {
  if (values) {
    // if values can be iterated on (like FormData)
    if (values.forEach) {
      values.forEach((value, key) => {
        if (allowedKeys.includes(key)) {
          state[key] = value;
        }
      });
    // else if it's just a plain object
    } else {
      for (let key in values) {
        if (allowedKeys.includes(key)) {
          state[key] = values[key];
        }
      }
    }
  }
}

function initForm(config, initialState) {
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

  // TODO: edit icon in images state
  initSnapIconEdit(config.snapIconImage, config.snapIconInput);
  initFormNotification(config.form, config.formNotification);
  initSnapScreenshotsEdit(
    config.screenshotsToolbar,
    config.screenshotsWrapper,
    state
  );

  // when anything is changed update the state
  marketForm.addEventListener('change', function() {
    updateState(state, new FormData(marketForm));
  });

  document.querySelector('.js-market-submit').addEventListener('click', function(event) {
    const diff = diffFormData(initialState, state);
    event.preventDefault();

    // if anything was changed, update state inputs and submit
    if (diff) {
    // TODO: temporary soluton - save clean state in state input,
    // so save still works until backend is update to understand diff
      const cleanState = JSON.parse(JSON.stringify(state));
      cleanState.images = cleanState.images.filter(image => image.status !== 'delete');
      stateInput.value = JSON.stringify(cleanState);
      diffInput.value = JSON.stringify(diff);

      marketForm.submit();
    }
  });

}

export {
  initSnapIconEdit,
  initFormNotification,
  initSnapScreenshotsEdit,
  initForm
};
