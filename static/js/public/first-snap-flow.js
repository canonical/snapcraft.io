/* globals ClipboardJS */

import 'whatwg-fetch';

function install(language) {
  const osPickers = document.querySelectorAll('.js-os-select');
  const osWrappers = document.querySelectorAll('.js-os-wrapper');

  if (osPickers) {
    osPickers.forEach(function (os) {
      os.addEventListener('click', function (e) {
        const osSelect = e.target.closest('.js-os-select');
        if (!osSelect) {
          return;
        }

        const selectedOs = osSelect.dataset.os;

        osPickers.forEach(function (picker) {
          picker.classList.remove('is-selected');
        });
        osSelect.classList.add('is-selected');

        if (osWrappers) {
          osWrappers.forEach(function (wrapper) {
            wrapper.classList.add('u-hide');
          });

        }
        const selectedEl = document.querySelector('.js-' + selectedOs);
        if (selectedEl) {
          selectedEl.classList.remove('u-hide');
        }

        if (!document.querySelector('.js-linux-manual')) {
          const continueBtn = document.querySelector('.js-continue');
          if (continueBtn) {
            continueBtn.href = `/first-snap/${language}/${selectedOs}/package`;
          }
        }
      });
    });
  }

  function onChange(e) {
    const type = e.target.value;
    const os = type.split('-')[0];
    const selected = document.querySelector('.js-' + type);
    const unselected = document.querySelector('[class*="js-' + os + '-"]:not(.js-' + type + ')');

    if (!selected && !unselected) {
      return;
    }

    if (osWrappers) {
      osWrappers.forEach(function (wrapper) {
        const rows = wrapper.querySelectorAll('.js-os-type');
        if (rows) {
          rows.forEach(function (row) {
            row.classList.add('u-hide');
          });
        }
      });
    }

    selected.classList.remove('u-hide');
    unselected.classList.add('u-hide');

    const continueBtn = document.querySelector('.js-continue');
    if (continueBtn) {
      continueBtn.href = `/first-snap/${language}/${type}/package`;
    }
  }

  document.addEventListener('change', onChange);

  if (typeof ClipboardJS !== 'undefined') {
    new ClipboardJS('.js-clipboard-copy');
  }
}

function getSnapCount(cb) {
  fetch('/snaps/api/snap-count').then(r => r.json())
    .then(data => {
      cb(data.count);
    });
}

function push() {
  let initialCount = null;
  let timer;
  let ready = false;

  function getCount(cb) {
    clearTimeout(timer);

    getSnapCount(count => {
      if (initialCount === null) {
        initialCount = count;
      } else if (count !== initialCount) {
        ready = true;
        cb();
      }
    });

    if (!ready) {
      timer = setTimeout(getCount.bind(this, cb), 2500);
    }
  }

  getCount(() => {
    const continueBtn = document.querySelector('.js-continue');
    if (continueBtn) {
      continueBtn.href = '/snaps';
      continueBtn.classList.add('p-button--positive');
      continueBtn.classList.remove('p-button--neutral');
      continueBtn.innerHTML = 'Continue';
    }
  });
}

export default {
  install,
  push
};
