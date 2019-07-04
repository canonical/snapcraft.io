// based on Vanilla accordion example
// https://github.com/vanilla-framework/vanilla-framework/blob/develop/examples/patterns/accordion.html

/**
  Toggles the necessary values on the accordion panels and handles to show or
  hide depending on the supplied values.
  @param {HTMLElement} element The tab that acts as the handles for the
    accordion panes.
  @param {Boolean} show Whether to show or hide the accordion panel.
*/
export const toggleAccordion = (element, show) => {
  element.setAttribute("aria-expanded", show);
  document
    .querySelector(element.getAttribute("aria-controls"))
    .setAttribute("aria-hidden", !show);
};

/**
  Attaches event listeners for the accordion open and close click events.
  @param {String} accordionContainerSelector The selector of the accordion container.
*/
export default function initAccordion(accordionContainerSelector) {
  // Set up an event listener on the container so that panels can be added
  // and removed and events do not need to be managed separately.
  document
    .querySelector(accordionContainerSelector)
    .addEventListener("click", e => {
      const target = e.target.closest(".p-accordion__tab");
      if (target && !target.disabled) {
        // Find any open panels within the container and close them.
        Array.from(
          e.currentTarget.querySelectorAll("[aria-expanded=true]")
        ).forEach(element => toggleAccordion(element, false));
        // Open the target.
        toggleAccordion(target, true);
      }
    });
}

/**
  Attaches click event to a button to close current accordion tab and open next one.
*/
export function initAccordionButtons(continueButton) {
  continueButton.addEventListener("click", event => {
    event.preventDefault();

    const currentPanel = continueButton.closest(".p-accordion__group");
    const currentToggle = currentPanel.querySelector(".p-accordion__tab");
    const currentSuccess = currentPanel.querySelector(".p-icon--success");
    const nextPanel = currentPanel.nextElementSibling;
    const nextToggle = nextPanel.querySelector(".p-accordion__tab");

    toggleAccordion(currentToggle, false);
    if (currentSuccess) {
      currentSuccess.classList.remove("u-hide");
    }
    toggleAccordion(nextToggle, true);
  });
}
