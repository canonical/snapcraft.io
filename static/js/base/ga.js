/* global dataLayer */
const origin = window.location.href;
const categoryPrefix = "snapcraft.io-";

const events = {
  ".global-nav a": "nav-0",
  ".p-navigation a": "nav-1",
  ".p-footer a": "footer-0",
  "#main-content .p-button--positive": "content-cta-0",
  ".p-strip .p-button--positive": "content-cta-0",
  "#main-content .p-button--neutral": "content-cta-1",
  ".p-strip .p-button--neutral": "content-cta-1",
  "#main-content .p-button": "content-cta-1",
  ".p-strip .p-button": "content-cta-1",
  "#main-content .p-card": "content-card",
  ".p-strip .p-card": "content-card",
  "#main-content .p-media-object--snap": "content-card-snap",
  ".p-strip .p-media-object--snap": "content-card-snap",
  "#main-content a": "content-link",
  ".p-strip a": "content-link"
};

function triggerEvent(category, from, to, label) {
  if (dataLayer) {
    dataLayer.push({
      event: "GAEvent",
      eventCategory: `${categoryPrefix}${category}`,
      eventAction: `from:${origin} to:${to}`,
      eventLabel: label,
      eventValue: undefined
    });
  }
}

if (typeof dataLayer !== "undefined") {
  window.addEventListener("click", function(e) {
    let target = e.target;
    if (!target || !e.target.closest) {
      return;
    }

    target = e.target.closest("a");
    if (!target) {
      target = e.target.closest("button");
    }

    if (!target) {
      target = e.target.closest(".p-code-snippet");
    }

    if (!target) {
      return;
    }

    for (let key in events) {
      if (target.matches(key)) {
        // This prevents subsequent matches triggering
        // So the order the events are added is important!
        e.stopImmediatePropagation();
        let label = target.text ? target.text.trim() : target.innerText.trim();
        if (label === "") {
          if (target.children[0] && target.children[0].alt) {
            label = `image: ${target.children[0].alt}`;
          }
        }

        triggerEvent(events[key], origin, target.href, label);

        break;
      }
    }

    // clicking on copy clipboard button
    if (target.matches(".js-clipboard-copy")) {
      e.stopImmediatePropagation();
      const clipboardTarget = target.dataset.clipboardTarget;

      const clipboardTargetEl = document.querySelector(clipboardTarget);
      const copiedValue = clipboardTargetEl.value
        ? clipboardTargetEl.value.trim()
        : clipboardTargetEl.text
          ? clipboardTargetEl.text.trim()
          : clipboardTargetEl.innerText.trim();

      triggerEvent(
        "clipboard-copy",
        origin,
        clipboardTarget,
        `Copied code: ${copiedValue}`
      );
    }

    // clicking on code snippet
    if (target.matches(".p-code-snippet")) {
      e.stopImmediatePropagation();
      const copyButton = target.querySelector(".js-clipboard-copy");
      const clipboardTarget = copyButton.dataset.clipboardTarget;

      const clipboardTargetEl = document.querySelector(clipboardTarget);
      const copiedValue = clipboardTargetEl.value
        ? clipboardTargetEl.value.trim()
        : clipboardTargetEl.text
          ? clipboardTargetEl.text.trim()
          : clipboardTargetEl.innerText.trim();

      triggerEvent(
        "clipboard-copy-click",
        origin,
        clipboardTarget,
        `Copied code: ${copiedValue}`
      );
    }
  });
}

export { triggerEvent };
