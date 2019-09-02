export const REM = parseFloat(
  getComputedStyle(document.documentElement).fontSize
);
export const MASK_OFFSET = REM / 2; // .5rem  is a default spacing unit in Vanilla

export const SCROLL_MARGIN = 400; // if element highlighted element doesn't fit into this top/bottom area of the screen, we scroll it into view
export const SCROLL_OFFSET_TOP = 10;
export const SCROLL_OFFSET_BOTTOM = 10;
