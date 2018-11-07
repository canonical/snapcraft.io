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

window.addEventListener("click", function(e) {
  let target = e.target.closest("a");
  if (!target) {
    target = e.target.closest("button");
  }

  if (!target) {
    return;
  }

  for (let key in events) {
    if (target.matches(key)) {
      // This prevents subsequent matches triggering
      // So the order the events are added is important!
      e.stopImmediatePropagation();
      let label = target.text.trim();
      if (label === "") {
        if (target.children[0] && target.children[0].alt) {
          label = `Image alt: ${target.children[0].alt}`;
        }
      }

      const event = {
        event: "GAEvent",
        eventCategory: `${categoryPrefix}${events[key]}`,
        eventAction: `from:${origin} to:${target.href}`,
        eventLabel: label,
        eventValue: undefined
      };

      if (dataLayer) {
        dataLayer.push(event);
      }

      break;
    }
  }
});
