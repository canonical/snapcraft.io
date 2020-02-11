export default function initExpandableArea() {
  const showMoreContainer = [].slice.call(
    document.querySelectorAll("[data-js='js-show-more']")
  );

  if (showMoreContainer && showMoreContainer.length > 0) {
    showMoreContainer.forEach(el => {
      const fadeEl = el.querySelector(".p-show-more__fade");
      const linkEl = el.querySelector(".p-show-more__link");

      if (fadeEl && linkEl) {
        linkEl.addEventListener("click", function(event) {
          event.preventDefault();

          fadeEl.classList.add("u-hide");
          el.classList.remove("is-collapsed");
        });
      }
    });
  }
}
