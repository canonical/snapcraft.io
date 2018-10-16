/* globals ClipboardJS */

export default function (language) {
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