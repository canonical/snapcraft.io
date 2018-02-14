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

function initSnapScreenshotsEdit(screenshotsToolbarElId, screenshotsWrapperElId, initialState) {
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

  setState(initialState);

  // actions on state
  const addScreenshots = (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setState({
        images: state.images.concat([{
          file, url: URL.createObjectURL(file),
          name: file.name,
          type: "screenshot",
          status: "new"
        }])
      });
    }
  };

  const selectScreenshot = (url) => {
    state.images.forEach(image => image.selected = false);

    const screenshot = state.images.filter(image => image.url === url)[0];

    if (url && screenshot) {
      screenshot.selected = true;
    }
  };

  // templates
  const screenshotTpl = (screenshot) => `
    <div class="col-2">
      <img
        class="p-screenshot ${screenshot.selected ? 'selected' : ''}"
        src="${screenshot.url}"
        alt=""
      />
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
    renderScreenshots(state.images.filter(image => image.type === "screenshot"));
  };

  render();

  const onScreenshotsChange = function() {
    addScreenshots(this.files);
    render();
  };

  // delegated click handlers
  document.addEventListener("click", function(event){
    // unselect any screenshots when clicked outside of them
    selectScreenshot();

    // clicking on [+] add screenshots button
    if (event.target.classList.contains('js-add-screenshots')
        || event.target.parentNode.classList.contains('js-add-screenshots')
      ) {
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

    // clicking on screenshot to select it
    if (event.target.classList.contains('p-screenshot')) {
      event.preventDefault();
      selectScreenshot(event.target.src);
    }

    render();
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
