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

function initSnapScreenshotsEdit(addElId, screenshotsToolbarElId, screenshotsWrapperElId, data) {
  const state = {};
  state.screenshots = data.map((url) => { return { url }; });

  const addScreenshotsEl = document.getElementById(addElId);
  const screenshotsToolbarEl = document.getElementById(screenshotsToolbarElId);
  const screenshotsWrapper = document.getElementById(screenshotsWrapperElId);

  const screenshotTpl = (screenshot) => `
    <div class="col-2">
      <img src="${screenshot.url}" alt="" />
    </div>
  `;

  const renderScreenshots = (screenshots) => {
    screenshotsWrapper.innerHTML = screenshots.map(screenshotTpl).join("");
  };

  const render = () => {
    renderScreenshots(state.screenshots);
  };

  render();

  const onScreenshotsChange = function() {
    const fileList = this.files;

    for (var i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      state.screenshots.push({ file, url: URL.createObjectURL(file) });

      render();
    }
  };

  addScreenshotsEl.addEventListener("click", function(event) {
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
