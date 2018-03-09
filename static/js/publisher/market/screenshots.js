import lightbox from './lightbox';

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
    if (nextState) {
      for (let key in nextState) {
        if (nextState.hasOwnProperty(key)) {
          state[key] = nextState[key];
        }
      }
    }

    let newState = Object.assign({}, state);
    newState.images = newState.images.filter(image => image.status !== 'delete');
    stateInput.value = JSON.stringify(newState);
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

  const deleteScreenshot = (screenshot) => {
    if (screenshot.status === 'new') {
      const index = state.images.findIndex(image => image.selected);
      state.images.splice(index, 1);
    } else {
      screenshot._previousStatus = screenshot.status;
      screenshot.status = 'delete';
    }

    setState();
  };

  const selectScreenshot = (url) => {
    state.images.forEach(image => image.selected = false);

    const screenshot = state.images.filter(image => image.url === url)[0];

    if (url && screenshot && screenshot.status !== 'delete') {
      screenshot.selected = true;
    }
  };

  // templates
  const rowTpl = (content) => `
    <div class="row">${content}</div>
  `;

  const screenshotTpl = (screenshot) => `
    <div class="col-2">
      <div class="p-screenshot__holder ${screenshot.status === 'delete' ? 'is-deleted' : ''}">
        <img
          class="p-screenshot ${screenshot.selected ? 'selected' : ''}"
          src="${screenshot.url}"
          alt=""
        />
      </div>
    </div>
  `;

  const emptyTpl = () => `
    <div class="col-12">
      <a class="p-empty-add-screenshots js-add-screenshots">Add images</a>
    </div>
  `;

  const changesTpl = (newCount, deleteCount) => {
    if (!newCount && !deleteCount) {
      return '';
    }
    return `<p>
      ${newCount ? newCount + ' image' + (newCount > 1 ? 's' : '') + ' to upload. ' : ''}
      ${deleteCount ? deleteCount + ' image' + (deleteCount > 1 ? 's' : '') + ' to delete.' : ''}
    </p>`;
  };

  const renderScreenshots = (screenshots) => {
    if (screenshots.length) {
      // show first 6 images in one row
      let html = rowTpl(screenshots.slice(0, 6).map(screenshotTpl).join(''));

      // if there is more screenshots (some marker for deletion?) show second row
      if (screenshots.length > 6) {
        html += rowTpl(screenshots.slice(6, 12).map(screenshotTpl).join(''));
      }

      const newScreenshots = screenshots.filter(image => image.status === 'new').length;
      const deleteScreenshots = screenshots.filter(image => image.status === 'delete').length;
      html += rowTpl(changesTpl(newScreenshots, deleteScreenshots));

      screenshotsWrapper.innerHTML = html;
    } else {
      screenshotsWrapper.innerHTML = emptyTpl();
    }
  };

  const render = () => {
    const screenshots = state.images.filter(image => image.type === 'screenshot');
    renderScreenshots(screenshots);

    if (screenshots.filter(image => image.status !== 'delete').length === 5) {
      document.querySelector('.js-add-screenshots').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-add-screenshots').removeAttribute('disabled');
    }

    if (screenshots.filter(image => image.selected).length === 0) {
      document.querySelector('.js-delete-screenshot').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-delete-screenshot').removeAttribute('disabled');
    }
  };

  render();

  const onScreenshotsChange = function() {
    addScreenshots(this.files);
    render();
  };

  // delegated click handlers
  document.addEventListener("click", function(event){
    // Delete screenshot
    if (event.target.classList.contains('js-delete-screenshot')
        || event.target.parentNode.classList.contains('js-delete-screenshot')
    ) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];
      if (screenshot) {
        deleteScreenshot(screenshot);
        selectScreenshot();
      }
      render();
    } else if (event.target.classList.contains('js-fullscreen-screenshot')
        || (event.target.parentNode && event.target.parentNode.classList.contains('js-fullscreen-screenshot'))
    ) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      // if none is selected pick first screenshot from list
      if (!screenshot) {
        screenshot = state.images.filter(image => image.type === 'screenshot')[0];
      }

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    } else {
      // unselect any screenshots when clicked outside of them
      selectScreenshot();
    }

    // clicking on [+] add screenshots button
    if (event.target.classList.contains('js-add-screenshots')
        || event.target.parentNode.classList.contains('js-add-screenshots')
    ) {
      event.preventDefault();

      const input = document.createElement('input');
      input.type = "file";
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
      setTimeout(() => {
        render();
      }, 50);
      return;
    }

    render();
  });

  document.addEventListener('dblclick', event => {
    if (event.target.classList.contains('p-screenshot')) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    }
  });
}


export {
  initSnapScreenshotsEdit
};
