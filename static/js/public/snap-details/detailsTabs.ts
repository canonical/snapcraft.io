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

  const activate = (controls: string | null): boolean => {
    const target = Array.from(tabs).find(
      (tab) => tab.getAttribute("aria-controls") === controls,
    );
    if (!target || !controls) {
      return false;
    }

    tabs.forEach((tab) => tab.setAttribute("aria-selected", "false"));
    target.setAttribute("aria-selected", "true");
    panels.forEach((panel) => {
      panel.classList.toggle("u-hide", panel.id !== controls);
    });
    return true;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const controls = tab.getAttribute("aria-controls");
      if (activate(controls)) {
        window.history.replaceState(null, "", `#${controls}`);
      }
    });
  });

  activate(window.location.hash.replace(/^#/, ""));
}
