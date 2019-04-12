// based on Vanilla accordion example
// https://github.com/vanilla-framework/vanilla-framework/blob/develop/examples/patterns/accordion.html

/**
  Attaches event listeners for the accordion open and close click events.
  @param {String} accordionContainerSelector The selector of the accordion container.
*/
export default function initAccordion(accordionContainerSelector) {
  /**
    Toggles the necessary values on the accordion panels and handles to show or
    hide depending on the supplied values.
    @param {HTMLElement} element The tab that acts as the handles for the
      accordion panes.
    @param {Boolean} show Whether to show or hide the accordion panel.
  */
  const toggle = (element, show) => {
    element.setAttribute("aria-expanded", show);
    document
      .querySelector(element.getAttribute("aria-controls"))
      .setAttribute("aria-hidden", !show);
  };
  // Set up an event listener on the container so that panels can be added
  // and removed and events do not need to be managed separately.
  document
    .querySelector(accordionContainerSelector)
    .addEventListener("click", e => {
      const target = e.target.closest(".p-accordion__tab");
      if (target && !target.disabled) {
        // Find any open panels within the container and close them.
        e.currentTarget
          .querySelectorAll("[aria-expanded=true]")
          .forEach(element => toggle(element, false));
        // Open the target.
        toggle(target, true);
      }
    });
}
