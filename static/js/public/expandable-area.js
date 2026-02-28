/**
   Initializes an expandable area

   @param {string} overflowSelector - CSS Selector for the element that can overflow
   @param {string} heightMatchSelector - CSS Selector for the element that overflowSelector's height should be compared against
*/
export default function initExpandableArea(
  overflowSelector,
  heightMatchSelector
) {
  const showMoreContainer = [].slice.call(
    document.querySelectorAll("[data-js='js-show-more']")
  );

  if (showMoreContainer && showMoreContainer.length > 0) {
    showMoreContainer.forEach((el) => {
      const fadeEl = el.querySelector(".p-show-more__fade");
      const linkEl = el.querySelector(".p-show-more__link");

      if (overflowSelector && heightMatchSelector) {
        const overflowEl = el.querySelector(overflowSelector);
        const heightMatchEl = el.querySelector(heightMatchSelector);

        if (overflowEl.scrollHeight <= heightMatchEl.scrollHeight) {
          el.removeAttribute("data-js");
          el.classList.remove("p-show-more");
        }
      }

      if (fadeEl && linkEl) {
        linkEl.addEventListener("click", function (event) {
          event.preventDefault();

          fadeEl.classList.add("u-hide");
          el.classList.remove("is-collapsed");
        });
      }
    });
  }
}
