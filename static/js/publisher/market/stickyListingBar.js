import throttle from "../../libs/throttle";

export default function() {
  const checkListingBarIsStuck = () => {
    const stickyBar = document.querySelector("#store-listing-notification");
    if (stickyBar.getBoundingClientRect().top == 0) {
      stickyBar.classList.add("sticky-shadow");
    } else {
      stickyBar.classList.remove("sticky-shadow");
    }
  };
  const onScroll = throttle(checkListingBarIsStuck, 10);
  document.addEventListener("scroll", onScroll);
  checkListingBarIsStuck();
}
