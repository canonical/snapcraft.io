import throttle from "../../libs/throttle";

export const toggleClassWhenStickyOnTop = (el, className) => {
  el.classList.toggle(className, el.getBoundingClientRect().top === 0);
};

export const toggleShadowWhenSticky = el => {
  toggleClassWhenStickyOnTop(el, "sticky-shadow");
};

export default function() {
  const stickyBar = document.querySelector(".snapcraft-p-sticky");
  toggleShadowWhenSticky(stickyBar);
  const onScroll = throttle(() => toggleShadowWhenSticky(stickyBar), 30);
  document.addEventListener("scroll", onScroll);
}
