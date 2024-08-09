// based on Vanilla accordion example
// https://github.com/vanilla-framework/vanilla-framework/blob/develop/examples/patterns/accordion.html

export const toggleAccordion = (element: HTMLElement, show: boolean): void => {
  element.setAttribute("aria-expanded", show.toString());
  const controlElId: string = `#${element.getAttribute("aria-controls")}`;
  const controlEl = document.querySelector(controlElId) as HTMLElement;
  controlEl.setAttribute("aria-hidden", `${show ? "false" : "true"}`);
};

export default function initAccordion(
  accordionContainerSelector: string,
): void {
  // Set up an event listener on the container so that panels can be added
  // and removed and events do not need to be managed separately.
  const accordionContainer = document.querySelector(
    accordionContainerSelector,
  ) as HTMLElement;
  accordionContainer.addEventListener("click", (e) => {
    const targetEl = e.target as HTMLElement;
    const target = targetEl.closest(
      "[class*='p-accordion__tab']",
    ) as HTMLButtonElement;
    if (target && !target.disabled) {
      // Find any open panels within the container and close them.
      const currentTarget = e.currentTarget as HTMLElement;
      const expandedElements = currentTarget.querySelectorAll(
        "[aria-expanded=true]",
      ) as NodeListOf<HTMLElement>;
      Array.from(expandedElements).forEach((element: HTMLElement) =>
        toggleAccordion(element, false),
      );
      // Open the target.
      toggleAccordion(target, true);
    }
  });

  // Add event listeners to buttons that expand the next section of the accordion
  const nextButtons = [].slice.call(
    document.querySelectorAll("[data-js='js-accordion-next-button']"),
  );
  if (nextButtons) {
    nextButtons.forEach((button: HTMLButtonElement) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();

        const currentPanel = button.closest(
          ".p-accordion__group",
        ) as HTMLElement;
        const currentToggle = currentPanel.querySelector(
          "[class*='p-accordion__tab']",
        ) as HTMLElement;
        const nextPanel = currentPanel.nextElementSibling as HTMLElement;
        const nextToggle = nextPanel.querySelector(
          "[class*='p-accordion__tab']",
        ) as HTMLElement;

        if (currentPanel && nextPanel) {
          toggleAccordion(currentToggle, false);
          toggleAccordion(nextToggle, true);
        }
      });
    });
  }
}

/**
  Attaches click event to a button to close current accordion tab and open next one.
*/
export function initAccordionButtons(continueButton: HTMLButtonElement): void {
  continueButton.addEventListener("click", (event) => {
    event.preventDefault();

    const currentPanel = continueButton.closest(
      ".p-accordion__group",
    ) as HTMLElement;
    const currentToggle = currentPanel.querySelector(
      "[class*='p-accordion__tab']",
    ) as HTMLElement;
    const currentSuccess = currentPanel.querySelector(".p-icon--success");
    const nextPanel = currentPanel.nextElementSibling as HTMLElement;
    const nextToggle = nextPanel.querySelector(
      "[class*='p-accordion__tab']",
    ) as HTMLElement;

    toggleAccordion(currentToggle, false);
    if (currentSuccess) {
      currentSuccess.classList.remove("u-hide");
    }
    toggleAccordion(nextToggle, true);
  });
}
