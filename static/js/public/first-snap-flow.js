/* globals ClipboardJS, ga */

import "whatwg-fetch";

function install(language) {
  const osPickers = document.querySelectorAll(".js-os-select");
  const osWrappers = document.querySelectorAll(".js-os-wrapper");

  function select(selectedOs) {
    if (osWrappers) {
      Array.prototype.slice.call(osWrappers).forEach(function(wrapper) {
        wrapper.classList.add("u-hide");
      });
    }
    const selectedEl = document.querySelector(".js-" + selectedOs);
    if (selectedEl) {
      selectedEl.classList.remove("u-hide");
    }

    if (!document.querySelector(".js-linux-manual")) {
      const paginationBtn = document.querySelector(`#js-pagination-next`);
      if (paginationBtn) {
        paginationBtn.classList.remove("is--disabled");
        paginationBtn.href = `/first-snap/${language}/${selectedOs}/package`;
      }
    }
  }

  if (osPickers) {
    const userAgent = window.navigator.userAgent;
    const isMac = !!userAgent.match(/Mac/);
    const isLinux = !!userAgent.match(/(Linux)|(X11)/);
    const userOS = isMac ? "macos" : isLinux ? "linux" : null;

    Array.prototype.slice.call(osPickers).forEach(function(os) {
      if (os.dataset.os === userOS) {
        os.classList.add("is-selected");
      }

      os.addEventListener("click", function(e) {
        const osSelect = e.target.closest(".js-os-select");
        if (!osSelect) {
          return;
        }

        osPickers.forEach(function(picker) {
          picker.classList.remove("is-selected");
        });
        osSelect.classList.add("is-selected");
        select(osSelect.dataset.os);
      });
    });

    if (userOS) {
      select(userOS);
    }
  }

  function onChange(e) {
    const type = e.target.value;
    const os = type.split("-")[0];
    const selected = document.querySelector(".js-" + type);
    const unselected = document.querySelector(
      "[class*='js-" + os + "-']:not(.js-" + type + ")"
    );

    if (!selected && !unselected) {
      return;
    }

    if (osWrappers) {
      osWrappers.forEach(function(wrapper) {
        const rows = wrapper.querySelectorAll(".js-os-type");
        if (rows) {
          rows.forEach(function(row) {
            row.classList.add("u-hide");
          });
        }
      });
    }

    selected.classList.remove("u-hide");
    unselected.classList.add("u-hide");

    const paginationBtn = document.querySelector(`#js-pagination-next`);
    if (paginationBtn) {
      paginationBtn.classList.remove("is--disabled");
      paginationBtn.href = `/first-snap/${language}/${type}/package`;
    }
  }

  document.addEventListener("change", onChange);

  if (typeof ClipboardJS !== "undefined") {
    new ClipboardJS(".js-clipboard-copy");
  }
}

function getSnapCount(cb) {
  fetch("/snaps/api/snap-count")
    .then(r => r.json())
    .then(data => {
      cb(data);
    });
}

function getArrayDiff(arr1, arr2) {
  let newArr;
  let oldArr;
  if (arr1.length === arr2.length) {
    return false;
  }

  if (arr1.length > arr2.length) {
    newArr = arr1;
    oldArr = arr2;
  } else {
    newArr = arr2;
    oldArr = arr1;
  }

  let newValues = [];

  newArr.forEach(item => {
    if (!oldArr.includes(item)) {
      newValues.push(item);
    }
  });

  return newValues;
}

function push() {
  let initialCount = null;
  let initialSnaps = [];
  let timer;
  let ready = false;

  function getCount(cb) {
    clearTimeout(timer);

    getSnapCount(data => {
      if (initialCount === null) {
        initialCount = data.count;
        initialSnaps = data.snaps;
      } else if (data.count !== initialCount) {
        const newSnaps = getArrayDiff(initialSnaps, data.snaps);

        if (newSnaps.length > 0 && typeof ga !== "undefined") {
          ga("gtm1.send", {
            hitType: "event",
            eventCategory: "First Snap Flow",
            eventAction: "Snap pushed",
            eventLabel: `${newSnaps.join(",")}`
          });
        }

        ready = true;
        cb(newSnaps[0]);
      }
    });

    if (!ready) {
      timer = setTimeout(getCount.bind(this, cb), 5000);
    }
  }

  getCount(snapName => {
    const continueBtn = document.querySelector(".js-continue");
    if (continueBtn) {
      continueBtn.href = `/${snapName}/listing?from=first-snap`;
      continueBtn.classList.add("p-button--positive");
      continueBtn.classList.remove("p-button--neutral");
      continueBtn.classList.remove("is--disabled");
      continueBtn.innerHTML = "Continue";
    }

    const paginationBtn = document.querySelector("#js-pagination-next");
    if (paginationBtn) {
      paginationBtn.href = `/${snapName}/listing?from=first-snap`;
      paginationBtn.classList.remove("is--disabled");
    }
  });
}

function updateNotification(notificationEl, className, message) {
  notificationEl.className = className;
  notificationEl.querySelector(".p-notification__response").innerHTML = message;
}

function successNotification(notificationEl, message) {
  updateNotification(notificationEl, "p-notification--positive", message);
}

function errorNotification(notificationEl, message) {
  updateNotification(notificationEl, "p-notification--negative", message);
}

function validateSnapName(name) {
  return /^[a-z0-9-]*[a-z][a-z0-9-]*$/.test(name) && !/^-|-$/.test(name);
}

function initChooseName(formEl, language) {
  const snapNameInput = formEl.querySelector("[name=snap-name]");

  snapNameInput.addEventListener("keyup", () => {
    const isValid = validateSnapName(snapNameInput.value);

    if (!isValid) {
      snapNameInput.parentNode.classList.add("is-error");
      formEl.querySelector("button").disabled = true;
    } else {
      snapNameInput.parentNode.classList.remove("is-error");
      formEl.querySelector("button").disabled = false;
    }
  });

  formEl.addEventListener("submit", event => {
    event.preventDefault();

    // set value in cookie an reload (to render with a new name)
    document.cookie = `fsf_snap_name_${language}=${snapNameInput.value};path=/`;
    window.location.reload();
  });
}

function initRegisterName(formEl, notificationEl, successEl) {
  const initialNotificationClassName = notificationEl.className;
  const initialNotificationHtml = notificationEl.querySelector(
    ".p-notification__response"
  ).innerHTML;

  const snapNameInput = formEl.querySelector("[name=snap-name]");

  snapNameInput.addEventListener("keyup", () => {
    const isValid = validateSnapName(snapNameInput.value);

    if (!isValid) {
      snapNameInput.parentNode.classList.add("is-error");
      formEl.querySelector("button").disabled = true;
    } else {
      snapNameInput.parentNode.classList.remove("is-error");
      formEl.querySelector("button").disabled = false;
    }

    updateNotification(
      notificationEl,
      initialNotificationClassName,
      initialNotificationHtml
    );
  });

  function showSuccess(message) {
    successEl.classList.remove("u-hide");
    successNotification(notificationEl, message);
  }

  function showError(message) {
    errorNotification(notificationEl, message);
  }

  formEl.addEventListener("submit", event => {
    event.preventDefault();
    let formData = new FormData(formEl);

    fetch("/register-snap/json", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(json => {
        if (json.errors) {
          showError(json.errors[0].message);
        } else if (json.code == "created") {
          showSuccess(`Name "${json.snap_name}" registered successfully.`);
        } else if (json.code == "already_owned") {
          showSuccess(`You already own "${json.snap_name}"".`);
        }
      })
      .catch(() => {
        errorNotification(
          notificationEl,
          "There was some problem registering name. Please try again."
        );
      });
  });
}

export default {
  initChooseName,
  initRegisterName,
  install,
  push
};
