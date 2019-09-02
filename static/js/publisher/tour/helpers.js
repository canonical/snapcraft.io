import { MASK_OFFSET } from "./constants";

// check if element is part of the DOM and is visible
export const isVisibleInDocument = el =>
  document.contains(el) && !(el.offsetWidth === 0 && el.offsetHeight === 0);

// find DOM elements for each step, ignore steps with no elements
// set default position to "bottom-left"
export function prepareSteps(steps) {
  return steps
    .map(step => {
      return {
        ...step,
        elements: [].slice.apply(
          document.querySelectorAll(`[data-tour="${step.id}"]`)
        ),
        position: step.position || "bottom-left"
      };
    })
    .filter(step => step.elements.length > 0);
}

// get rectangle of given DOM element
// relative to the page, taking scroll into account
const getRectFromEl = el => {
  let clientRect = el.getBoundingClientRect();
  let ret = {
    top:
      clientRect.top +
      (window.pageYOffset || document.documentElement.scrollTop),
    left:
      clientRect.left +
      (window.pageXOffset || document.documentElement.scrollLeft),
    width: clientRect.width,
    height: clientRect.height
  };

  return ret;
};

// get mask based on rectangle
const getMaskFromRect = rect => {
  let top = rect.top - MASK_OFFSET;
  if (top < 0) {
    top = 0;
  }

  let left = rect.left - MASK_OFFSET;
  if (left < 0) {
    left = 0;
  }

  let bottom = rect.top + rect.height + MASK_OFFSET;
  let right = rect.left + rect.width + MASK_OFFSET;

  return {
    top,
    bottom,
    left,
    right
  };
};

// calculate mask for given element
const getMaskFromEl = el => getMaskFromRect(getRectFromEl(el));

// get mask that is an union of all elements' masks
// calculates the rectangle that contains each individual element rectangles
export const getMaskFromElements = elements => {
  const masks = elements
    .filter(isVisibleInDocument)
    .map(el => getMaskFromEl(el));

  return masks.reduce(
    (unionMask, elMask) => {
      return {
        top: Math.min(unionMask.top, elMask.top),
        left: Math.min(unionMask.left, elMask.left),
        bottom: Math.max(unionMask.bottom, elMask.bottom),
        right: Math.max(unionMask.right, elMask.right)
      };
    },
    {
      top: Infinity,
      left: Infinity,
      right: 0,
      bottom: 0
    }
  );
};
