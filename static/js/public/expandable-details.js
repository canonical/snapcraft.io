export default function initExpandableSnapDetails() {
  const moreEl = document.querySelector(".snap-description-more");
  const textEl = document.querySelector(".js-snap-description-text");
  const detailsEl = document.querySelector(".js-snap-description-details");

  if (textEl.clientHeight > detailsEl.clientHeight) {
    textEl.parentNode.classList.add("snap-description-collapsed");
    moreEl.classList.remove("u-hide");
  }

  document
    .querySelector(".js-show-more-description")
    .addEventListener("click", function(event) {
      event.preventDefault();

      moreEl.classList.add("u-hide");
      document
        .querySelector(".snap-description-collapsed")
        .classList.remove("snap-description-collapsed");
    });
}
