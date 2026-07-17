export default function initDetailsTabs(): void {
  const tabs = document.querySelectorAll<HTMLAnchorElement>(
    '[data-js="details-tab"]',
  );
  const panels = document.querySelectorAll<HTMLElement>(
    '[data-js="details-tabpanel"]',
  );

  if (!tabs.length) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const controls = tab.getAttribute("aria-controls");

      tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");

      panels.forEach((panel) => {
        panel.classList.toggle("u-hide", panel.id !== controls);
      });
    });
  });
}
