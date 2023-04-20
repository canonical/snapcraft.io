function initFSFLanguageSelect() {
  const flowLinksContainer = document.querySelector(
    "[data-js='flow-links-container']"
  ) as HTMLElement;
  const flowLinks = document.querySelectorAll(
    "[data-js='flow-link']"
  ) as NodeList;

  let activeFlowLink = flowLinksContainer.querySelector(
    "[aria-current='page']"
  ) as HTMLElement;

  let activeFlowLanguage = activeFlowLink.getAttribute("data-flow");

  let activeFlowContent = document.querySelector(
    `[data-flow-details='${activeFlowLanguage}']`
  ) as HTMLElement;

  function hideCurrentFlow() {
    activeFlowLink.removeAttribute("aria-current");
    activeFlowContent.classList.add("u-hide");
  }

  function updateFlow(
    newFlowLink: HTMLLinkElement,
    newFlowLanguage: string,
    newFlowContent: HTMLElement
  ) {
    activeFlowLink = newFlowLink;
    activeFlowLanguage = newFlowLanguage;
    activeFlowContent = newFlowContent;
  }

  function showNewFlow(
    newFlowLink: HTMLLinkElement,
    newFlowContent: HTMLElement
  ) {
    newFlowLink.setAttribute("aria-current", "page");
    newFlowContent.classList.remove("u-hide");
  }

  function handleFlowChange(
    newFlowLink: HTMLLinkElement,
    newFlowLanguage: string
  ) {
    const newFlowContent = document.querySelector(
      `[data-flow-details='${newFlowLanguage}']`
    ) as HTMLElement;

    hideCurrentFlow();
    showNewFlow(newFlowLink, newFlowContent);
    updateFlow(newFlowLink, newFlowLanguage, newFlowContent);
  }

  activeFlowContent.classList.remove("u-hide");

  flowLinks.forEach((flowLink) => {
    flowLink.addEventListener("click", (e: Event) => {
      e.preventDefault();

      const target = e.target as HTMLLinkElement;
      const newFlowLanguage = target.getAttribute("data-flow");

      handleFlowChange(target, newFlowLanguage || "");
    });
  });

  const flowOptions = document.querySelector(
    "[data-js='flow-options']"
  ) as HTMLSelectElement;

  flowOptions.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newFlowLanguage = target.value;
    const flowLink = flowLinksContainer.querySelector(
      `[data-flow='${newFlowLanguage}']`
    ) as HTMLLinkElement;

    handleFlowChange(flowLink, newFlowLanguage);
  });
}

export { initFSFLanguageSelect };
