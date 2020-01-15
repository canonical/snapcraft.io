export default function initExpandableDistroChart() {
  const moreEl = document.querySelector(".snapcraft-distro-chart__more");
  const detailsEl = document.querySelector(".snapcraft-distro-chart");

  if (moreEl && detailsEl) {
    moreEl.classList.remove("u-hide");
    detailsEl.classList.add("is-collapsed");

    document
      .querySelector(".js-show-more-description")
      .addEventListener("click", function(event) {
        event.preventDefault();

        moreEl.classList.add("u-hide");
        detailsEl.classList.remove("is-collapsed");
      });
  }
}
