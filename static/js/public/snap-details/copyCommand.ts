export default function initCopyCommand() {
  document.addEventListener("click", (e) => {
    const button = (e.target as HTMLElement).closest(
      "[data-js='copy-install-command']",
    ) as HTMLElement | null;

    if (!button) return;

    const targetId = button.dataset.copyTarget;
    if (!targetId) return;

    const codeEl = document.getElementById(targetId);
    if (!codeEl) return;

    const text = codeEl.textContent?.trim();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      const icon = button.querySelector("i");
      if (icon) {
        icon.className = "p-icon--success";
        button.title = "Copied!";
        setTimeout(() => {
          icon.className = "p-icon--copy";
          button.title = "Copy to clipboard";
        }, 2000);
      }
    });
  });
}
