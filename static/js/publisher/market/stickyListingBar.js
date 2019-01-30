export default function() {
  document.addEventListener("scroll", function() {
    const stickyBar = document.querySelector("#store-listing-notification");
    if (stickyBar.getBoundingClientRect().top == 0) {
      stickyBar.classList.add("sticky-shadow");
    } else {
      stickyBar.classList.remove("sticky-shadow");
    }
  });
}
