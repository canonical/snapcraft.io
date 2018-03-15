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


// TODO: test
function diffFormData(initialState, formData) {
  const diff = {};

  for (let key in initialState) {
    if (key === 'images') {
      let images = JSON.parse(formData.get('state'))['images'];

      if (JSON.stringify(initialState[key]) !== JSON.stringify(images)) {
        diff[key] = images;
      }
    } else {
      if (initialState[key] !== formData.get(key)) {
        diff[key] = formData.get(key);
      }
    }
  }

  // only return diff when there are any changes
  return Object.keys(diff).length > 0 ? diff : null;
}

function initForm(config, initialState) {
  // TODO: edit icon in images state
  initSnapIconEdit(config.snapIconImage, config.snapIconInput);
  initFormNotification(config.form, config.formNotification);
  // TODO: move state out of screenshots (to share with icon and rest of the form?)
  initSnapScreenshotsEdit(
    config.screenshotsToolbar,
    config.screenshotsWrapper,
    {
      images: JSON.parse(JSON.stringify(initialState.images))
    }
  );

  document.querySelector('.js-market-submit').addEventListener('click', function(event){
    const marketForm = document.getElementById(config.form);
    // const data = new FormData(marketForm);
    // const diff = diffFormData(initialState, data);

    event.preventDefault();

    // TODO: only save changed data
    // if (diff) {
    marketForm.submit();
    //}
  });
}

export {
  initSnapIconEdit,
  initFormNotification,
  initSnapScreenshotsEdit,
  initForm
};
