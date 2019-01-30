export default function() {
  const stickyBar = document.querySelector("#store-listing-notification");
  const listingsTitle = document.querySelector("#snap-name-listing");

  const observer = new IntersectionObserver(entry => {
    if (entry[0].isIntersecting) {
      stickyBar.classList.remove("sticky-shadow");
    } else {
      stickyBar.classList.add("sticky-shadow");
    }
  });
  observer.observe(listingsTitle);
}
