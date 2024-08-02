export function animateScrollTo(to: string | number | HTMLElement, offset = 0) {
  const element = (document.scrollingElement as HTMLElement) || window;

  if (typeof to === "string") {
    to = document.querySelector(to) as HTMLElement;
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

export function initLinkScroll(link: HTMLLinkElement, { offset = 0 }) {
  if (link && (link.dataset.scrollTo || link.href)) {
    const href =
      (link.dataset.scrollTo as string) ||
      (link.getAttribute("href") as string);
    const target = document.querySelector(href) as HTMLElement;
    if (target) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        animateScrollTo(target, offset);
        setTimeout(() => window.history.pushState({}, "", href), 100);
      });
    }
  }
}
