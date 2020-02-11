export default function initExpandableYaml() {
  const showMoreContainer = [].slice.call(
    document.querySelectorAll("[data-js='js-show-more']")
  );

  if (showMoreContainer) {
    showMoreContainer.forEach(el => {
      const fadeEL = el.querySelector(".p-show-more__fade");
      const linkEl = el.querySelector(".p-show-more__link");

      if (fadeEL && linkEl) {
        linkEl.addEventListener("click", function(event) {
          event.preventDefault();

          fadeEL.classList.add("u-hide");
          el.classList.remove("is-collapsed");
        });
      }
    });
  }
}
