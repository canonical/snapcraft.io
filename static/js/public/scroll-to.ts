export function animateScrollTo(
  to: HTMLElement | number | string,
  offset = 0,
): void {
  const element = document.scrollingElement!;

  if (typeof to === "string") {
    to = document.querySelector(to) as HTMLElement;
  }

  if (typeof to !== "number") {
    to = to.getBoundingClientRect().top + element.scrollTop;
  }

  to = to - offset;

  element.scrollTo({ top: to, left: 0, behavior: "smooth" });
}

export function initLinkScroll(
  link: HTMLLinkElement,
  { offset = 0 }: { offset: number },
): void {
  if (link.dataset.scrollTo || link.href) {
    const href = link.dataset.scrollTo! || link.getAttribute("href")!;
    const target = document.querySelector(href) as HTMLElement;

    if (target) {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        animateScrollTo(target, offset);

        setTimeout(() => {
          window.history.pushState({}, "", href);
        }, 100);
      });
    }
  }
}
