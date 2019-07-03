import { triggerEvent } from "../base/ga";
import debounce from "../libs/debounce";

const isInViewport = el => {
  var bounding = el.getBoundingClientRect();
  return (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    bounding.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
};

export default function triggerEventWhenVisible(selector) {
  const el = document.querySelector(selector);
  const origin = window.location.href;

  if (isInViewport(el)) {
    triggerEvent(
      "element-visible",
      origin,
      selector,
      `Element visible on screen: ${selector}`
    );
  } else {
    let triggered = false;
    window.addEventListener(
      "scroll",
      debounce(() => {
        if (!triggered && isInViewport(el)) {
          triggerEvent(
            "element-visible",
            origin,
            selector,
            `Element visible on screen: ${selector}`
          );
          triggered = true;
        }
      }, 500)
    );
  }
}
