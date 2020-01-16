export default function initExpandableDistroChart() {
  const moreEl = document.querySelector(".snapcraft-distro-chart__more");
  const lessEl = document.querySelector(".snapcraft-distro-chart__less");
  const detailsEl = document.querySelector(".snapcraft-distro-chart");

  if (moreEl && lessEl && detailsEl) {
    moreEl
      .querySelector("[data-js='js-show-more-description']")
      .addEventListener("click", function(event) {
        event.preventDefault();

        moreEl.classList.toggle("u-show--small");
        lessEl.classList.toggle("u-show--small");
        detailsEl.classList.remove("is-collapsed");
      });

    lessEl
      .querySelector("[data-js='js-show-less-description']")
      .addEventListener("click", function(event) {
        event.preventDefault();

        moreEl.classList.toggle("u-show--small");
        lessEl.classList.toggle("u-show--small");
        detailsEl.classList.add("is-collapsed");
      });
  }
}
