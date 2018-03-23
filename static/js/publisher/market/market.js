import { initSnapScreenshotsEdit } from './screenshots';
import { updateState, diffState } from './state';

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

  initSnapIconEdit(config.snapIconImage, config.snapIconInput, state);
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
    const diff = diffState(initialState, state);
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
