export default function() {
  const stickyBar = document.querySelector(".snapcraft-p-sticky");
  const listings = document.querySelector(
    ".u-float--left.p-heading--three.u-no-margin--bottom"
  );

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        stickyBar.classList.remove("sticky-shadow");
      } else {
        stickyBar.classList.add("sticky-shadow");
      }
    });
  });

  listings.forEach(listing => {
    observer.observe(listing);
  });
}
