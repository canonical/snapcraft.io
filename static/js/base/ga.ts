const urlLocation = window.location.href;
const categoryPrefix = "snapcraft.io-";

const events: Record<string, string> = {
  ".global-nav a": "nav-0",
  ".p-navigation a": "nav-1",
  "#footer a": "footer-0",
  "#main-content .p-button--positive": "content-cta-0",
  ".p-strip .p-button--positive": "content-cta-0",
  "#main-content .p-button": "content-cta-1",
  ".p-strip .p-button": "content-cta-1",
  "#main-content .p-card": "content-card",
  ".p-strip .p-card": "content-card",
  "#main-content .p-media-object--snap": "content-card-snap",
  ".p-strip .p-media-object--snap": "content-card-snap",
  "#main-content a": "content-link",
  ".p-strip a": "content-link",
};

type Event = {
  category: string;
  from: string;
  to: string;
  label: string;
};

function triggerEvent({ category, from, to, label }: Event): void {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: "GAEvent",
      eventCategory: `${categoryPrefix}${category}`,
      eventAction: `from:${from} to:${to}`,
      eventLabel: label,
      eventValue: undefined,
    } as DataLayerEvent);
  }
}

function triggerEventReleaseUI(action: string, label: string): void {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: "GAEvent",
      eventCategory: `Release UI`,
      eventAction: action,
      eventLabel: label,
      eventValue: undefined,
    });
  }
}

if (typeof window.dataLayer !== "undefined") {
  window.addEventListener("click", function (e) {
    let target;

    const eventTarget = e.target as HTMLElement;

    if (!eventTarget?.closest) {
      return;
    }

    target = eventTarget.closest("a") as HTMLAnchorElement;

    if (!target) {
      target = eventTarget.closest("button")!;
    }

    if (!target) {
      return;
    }

    for (const key in events) {
      if (target.matches(key)) {
        // This prevents subsequent matches triggering
        // So the order the events are added is important!
        e.stopImmediatePropagation();
        let label = "";

        if (target.innerText) {
          label = target.innerText.trim();
        }

        if (label === "") {
          if (
            target.children[0] &&
            target.children[0] instanceof HTMLImageElement
          ) {
            label = `image: ${target.children[0].alt}`;
          }
        }

        if (target instanceof HTMLAnchorElement) {
          triggerEvent({
            category: events[key],
            from: urlLocation,
            to: target.href,
            label,
          });
        }

        break;
      }
    }
  });
}

export { triggerEvent, triggerEventReleaseUI };
