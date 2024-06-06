/* globals ClipboardJS, ga */

import "whatwg-fetch";

import { toggleAccordion } from "./accordion";

function install(language: any, fsfFlow: any) {
  const osPickers = Array.from(document.querySelectorAll(".js-os-select"));
  const osWrappers = Array.from(document.querySelectorAll(".js-os-wrapper"));

  function select(selectedOs: string) {
    if (osWrappers) {
      osWrappers.forEach(function (wrapper) {
        wrapper.classList.add("u-hide");
      });
    }
    const selectedEl = document.querySelector(".js-" + selectedOs);
    if (selectedEl) {
      selectedEl.classList.remove("u-hide");
    }

    if (!document.querySelector(".js-linux-manual")) {
      const paginationBtn = document.querySelector(
        `#js-pagination-next`
      ) as HTMLLinkElement;
      if (paginationBtn) {
        paginationBtn.classList.remove("is-disabled");
        paginationBtn.href = `/${fsfFlow}/${language}/${selectedOs}/package`;
      }
    }
  }

  if (osPickers) {
    const userAgent = window.navigator.userAgent;
    const isMac = !!userAgent.match(/Mac/);
    const isLinux = !!userAgent.match(/(Linux)|(X11)/);
    const userOS = isMac ? "macos" : isLinux ? "linux" : null;

    osPickers.forEach(function (os: any) {
      if (os.dataset.os === userOS) {
        os.classList.add("is-selected");
      }

      os.addEventListener("click", function (e: Event) {
        const target = e.target as HTMLElement;
        const osSelect = target.closest(".js-os-select") as HTMLElement;
        if (!osSelect) {
          return;
        }

        osPickers.forEach(function (picker) {
          picker.classList.remove("is-selected");
        });
        osSelect.classList.add("is-selected");
        if (osSelect.dataset && osSelect.dataset.os) {
          select(osSelect.dataset.os);
        }
      });
    });

    if (userOS) {
      select(userOS);
    }
  }

  function onChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const type = target.value;
    const os = type.split("-")[0];
    const selected = document.querySelector(".js-" + type) as HTMLElement;
    const unselected = document.querySelector(
      "[class*='js-" + os + "-']:not(.js-" + type + ")"
    ) as HTMLElement;

    if (!selected && !unselected) {
      return;
    }

    if (osWrappers) {
      osWrappers.forEach(function (wrapper) {
        const rows = Array.from(wrapper.querySelectorAll(".js-os-type"));
        if (rows) {
          rows.forEach(function (row) {
            row.classList.add("u-hide");
          });
        }
      });
    }

    selected.classList.remove("u-hide");
    unselected.classList.add("u-hide");

    const paginationBtn = document.querySelector(
      `#js-pagination-next`
    ) as HTMLLinkElement;
    if (paginationBtn) {
      paginationBtn.classList.remove("is-disabled");
      paginationBtn.href = `/${fsfFlow}/${language}/${type}/package`;
    }
  }

  document.addEventListener("change", onChange);

  // @ts-ignore
  if (typeof ClipboardJS !== "undefined") {
    // @ts-ignore
    new ClipboardJS(".js-clipboard-copy");
  }
}

function getSnapCount(cb: { (data: any): void; (arg0: any): void }) {
  fetch("/snaps/api/snap-count")
    .then((r) => r.json())
    .then((data) => {
      cb(data);
    });
}

function getArrayDiff(arr1: string | any[], arr2: string | any[]) {
  let newArr: any;
  let oldArr: any;
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

  let newValues: Array<any> = [];

  newArr.forEach((item: string) => {
    if (!oldArr.includes(item)) {
      newValues.push(item);
    }
  });

  return newValues;
}

function push() {
  let initialCount: null = null;
  let initialSnaps: string | any[] = [];
  let timer: string | number | NodeJS.Timeout | undefined;
  let ready = false;

  const getCount = (cb: { (snapName: any): void; (arg0: any): void }) => {
    clearTimeout(timer);

    getSnapCount((data) => {
      if (initialCount === null) {
        initialCount = data.count;
        initialSnaps = data.snaps;
      } else if (data.count !== initialCount) {
        const newSnaps = getArrayDiff(initialSnaps, data.snaps);

        // @ts-ignore
        if (newSnaps.length > 0 && typeof ga !== "undefined") {
          // @ts-ignore
          ga("gtm1.send", {
            hitType: "event",
            eventCategory: "First Snap Flow",
            eventAction: "Snap pushed",
            // @ts-ignore
            eventLabel: `${newSnaps.join(",")}`,
          });
        }

        ready = true;
        // @ts-ignore
        cb(newSnaps[0]);
      }
    });

    if (!ready) {
      // @ts-ignore
      timer = setTimeout(getCount.bind(this, cb), 5000);
    }
  };

  getCount((snapName) => {
    // Enable "Continue" button
    const continueBtn = document.querySelector(
      ".js-continue"
    ) as HTMLLinkElement;
    if (continueBtn) {
      continueBtn.href = `/${snapName}/releases`;
      continueBtn.classList.add("p-button--positive");
      continueBtn.classList.remove("p-button");
      continueBtn.classList.remove("is-disabled");
      continueBtn.innerHTML = "Continue";
    }
    // Update "Go to listing" button for a published snap
    const paginationBtn = document.querySelector(
      "#js-pagination-next"
    ) as HTMLLinkElement;
    if (paginationBtn) {
      paginationBtn.href = `/${snapName}/listing?from=first-snap`;
      paginationBtn.classList.remove("is-disabled");
    }
  });
}

function updateNotification(
  notificationEl: {
    className: any;
    querySelector: (arg0: string) => { (): any; new (): any; innerHTML: any };
  },
  className: string,
  message: any
) {
  notificationEl.className = className;
  notificationEl.querySelector(".p-notification__message").innerHTML = message;
}

function successNotification(
  notificationEl: {
    className: any;
    querySelector: (arg0: string) => { (): any; new (): any; innerHTML: any };
  },
  message: any
) {
  updateNotification(notificationEl, "p-notification--positive", message);
}

function errorNotification(
  notificationEl: {
    className: any;
    querySelector: (arg0: string) => { (): any; new (): any; innerHTML: any };
  },
  message: string
) {
  updateNotification(notificationEl, "p-notification--negative", message);
}

function validateSnapName(name: string) {
  return /^[a-z0-9-]*[a-z][a-z0-9-]*$/.test(name) && !/^-|-$/.test(name);
}

function initChooseName(
  formEl: {
    querySelector: (arg0: string) => {
      (): any;
      new (): any;
      disabled: boolean;
    };
    addEventListener: (arg0: string, arg1: (event: any) => void) => void;
  },
  language: any
) {
  const snapNameInput = formEl.querySelector("[name=snap-name]") as any;

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

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();

    // set value in cookie an reload (to render with a new name)
    document.cookie = `fsf_snap_name_${language}=${snapNameInput.value};path=/`;
    window.location.reload();
  });
}

function initRegisterName(
  formEl: HTMLFormElement,
  notificationEl: HTMLElement,
  successEl: { classList: { remove: (arg0: string) => void } }
) {
  const snapNameInput = formEl.querySelector(
    "[name=snap-name]"
  ) as HTMLInputElement;

  snapNameInput.addEventListener("keyup", () => {
    if (notificationEl.classList.contains("u-hide")) {
      notificationEl.classList.remove("u-hide");
    }

    const isValid = validateSnapName(snapNameInput.value);

    const inputParent = snapNameInput.parentNode as HTMLElement;
    const formButton = formEl.querySelector("button") as HTMLButtonElement;

    if (inputParent) {
      if (!isValid) {
        inputParent.classList.add("is-error");
        formButton.disabled = true;
      } else {
        inputParent.classList.remove("is-error");
        formButton.disabled = false;
      }
    }
  });

  function showSuccess(message: string | undefined) {
    successEl.classList.remove("u-hide");
    successNotification(notificationEl, message);
  }

  function showError(message: string) {
    errorNotification(notificationEl, message);
  }

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    let formData = new FormData(formEl);
    const submitButton = formEl.querySelector(
      "[data-js='js-snap-name-register']"
    ) as HTMLButtonElement;

    const currentPanel = formEl.closest(
      ".p-accordion__group"
    ) as HTMLFormElement;
    const currentToggle = currentPanel.querySelector(
      ".p-accordion__tab"
    ) as HTMLElement;
    const nextPanel = currentPanel.nextElementSibling as HTMLElement;
    const nextToggle = nextPanel.querySelector(
      ".p-accordion__tab"
    ) as HTMLElement;

    const enableButton = () => {
      if (submitButton.disabled) {
        submitButton.classList.remove("has-spinner");
        submitButton.disabled = false;
      }
    };

    // Enable "Go to listing" button for an unpublished app
    const enableGoToListingButton = () => {
      const formField = formEl.querySelector(
        "[name=snap-name]"
      ) as HTMLInputElement;
      const snapName = formField.value;
      const paginationBtn = document.querySelector(
        "#js-pagination-next"
      ) as HTMLLinkElement;
      if (paginationBtn) {
        paginationBtn.href = `/${snapName}/listing?from=first-snap-unpublished`;
        paginationBtn.classList.remove("is-disabled");
        ``;
      }
    };

    // Show spinner if data fetch takes long
    const timer = setTimeout(() => {
      if (currentToggle.getAttribute("aria-expanded") === "true") {
        submitButton.classList.add("has-spinner");
        submitButton.disabled = true;
      }
    }, 400);

    fetch("/register-snap/json", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        clearTimeout(timer);
        let message;
        if (json.errors) {
          showError(json.errors[0].message);
          enableButton();
          return;
        } else if (json.code == "created") {
          message = `Name "${json.snap_name}" registered successfully.`;
        } else if (json.code == "already_owned") {
          message = `You already own "${json.snap_name}"".`;
        }
        // Jump to the next accordion panel
        toggleAccordion(currentToggle, false);
        toggleAccordion(nextToggle, true);

        enableButton();
        showSuccess(message);
        enableGoToListingButton();
      })
      .catch(() => {
        clearTimeout(timer);
        if (submitButton.disabled) {
          submitButton.classList.remove("has-spinner");
          submitButton.disabled = false;
        }
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
  push,
};
