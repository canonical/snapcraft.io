export default function initExpandableArea(
  overflowSelector: string,
  heightMatchSelector: string,
): void {
  const showMoreContainer = [].slice.call(
    document.querySelectorAll("[data-js='js-show-more']"),
  ) as Array<HTMLElement>;

  if (showMoreContainer && showMoreContainer.length > 0) {
    showMoreContainer.forEach((el) => {
      const fadeEl = el.querySelector(".p-show-more__fade");
      const linkEl = el.querySelector(".p-show-more__link");
      const lessEl = el.querySelector(".p-show-more__less");

      if (overflowSelector && heightMatchSelector) {
        const overflowEl = el.querySelector(overflowSelector) as HTMLElement;
        const heightMatchEl = el.querySelector(
          heightMatchSelector,
        ) as HTMLElement;

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
          lessEl?.classList.remove("u-hide");
        });
      }

      if (fadeEl && lessEl) {
        lessEl
          .querySelector("button")
          ?.addEventListener("click", function (event) {
            event.preventDefault();

            lessEl.classList.add("u-hide");
            el.classList.add("is-collapsed");
            fadeEl.classList.remove("u-hide");
          });
      }
    });
  }
}
