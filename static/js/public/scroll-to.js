export function animateScrollTo(to, offset = 0) {
  const element = document.scrollingElement || window;

  if (typeof to === "string") {
    to = document.querySelector(to);
    if (!to) {
      throw Error(`Can't find any element for "${to}" in animateScrollTo.`);
    }
  }
  if (typeof to !== "number") {
    to = to.getBoundingClientRect().top + element.scrollTop;
  }
  to = to - offset;

  if (element.scrollTo) {
    element.scrollTo({ top: to, left: 0, behavior: "smooth" });
  } else {
    element.scrollTop = to;
  }
}

export function initLinkScroll(link, { offset = 0 }) {
  if (link && (link.dataset.scrollTo || link.href)) {
    const href = link.dataset.scrollTo || link.getAttribute("href");
    const target = document.querySelector(href);
    if (target) {
      link.addEventListener("click", event => {
        event.preventDefault();
        animateScrollTo(target, offset);
        setTimeout(() => window.history.pushState({}, null, href), 100);
      });
    }
  }
}
