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

function initSnapScreenshotsEdit(screenshotsToolbarElId, screenshotsWrapperElId, data) {
  // DOM elements
  const screenshotsToolbarEl = document.getElementById(screenshotsToolbarElId);
  const screenshotsWrapper = document.getElementById(screenshotsWrapperElId);

  // simple state handling (and serializing as JSON in hidden input)
  const state = {};
  const stateInput = document.createElement('input');
  stateInput.type = "hidden";
  stateInput.name = "state";

  screenshotsToolbarEl.parentNode.appendChild(stateInput);

  const setState = function(nextState) {
    for (let key in nextState) {
      if (nextState.hasOwnProperty(key)) {
        state[key] = nextState[key];
      }
    }

    stateInput.value = JSON.stringify(state);
  };

  setState({
    screenshots: data.map((url) => { return { url }; })
  });

  // templates
  const screenshotTpl = (screenshot) => `
    <div class="col-2">
      <img src="${screenshot.url}" alt="" />
    </div>
  `;

  const emptyTpl = () => `
    <div class="col-12">
      <a class="p-empty-add-screenshots js-add-screenshots">Add images</a>
    </div>
  `;

  const renderScreenshots = (screenshots) => {
    if (screenshots.length) {
      screenshotsWrapper.innerHTML = screenshots.map(screenshotTpl).join("");
    } else {
      screenshotsWrapper.innerHTML = emptyTpl();
    }
  };

  const render = () => {
    renderScreenshots(state.screenshots);
  };

  render();

  const onScreenshotsChange = function() {
    const fileList = this.files;

    for (var i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setState({
        screenshots: state.screenshots.concat([{ file, url: URL.createObjectURL(file), name: file.name }])
      });

      render();
    }
  };

  document.addEventListener("click", function(event){
    if (event.target.classList.contains('js-add-screenshots')) {
      event.preventDefault();

      const input = document.createElement('input');
      input.type = "file";
      input.multiple = "multiple";
      input.accept = "image/*";
      input.name="screenshots";
      input.hidden = "hidden";

      screenshotsToolbarEl.parentNode.appendChild(input);
      input.addEventListener("change", onScreenshotsChange);
      input.click();
    }
  });
}

function initFormNotification(formElId, notificationElId) {
  var form = document.getElementById(formElId);

  form.addEventListener("change", function() {
    var notification = document.getElementById(notificationElId);
    if (notification) {
      notification.parentNode.removeChild(notification);
    }
  });
  var notification = document.getElementById(notificationElId);

  if (notification) {
    setTimeout(function(){
      notification.parentNode.removeChild(notification);
    }, 20000);
  }
}

const market = {
  initSnapIconEdit,
  initFormNotification,
  initSnapScreenshotsEdit
};

export default market;
