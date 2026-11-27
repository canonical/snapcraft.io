import { setModalReturnURL, setupContactModal } from "./contact-modal";
import { clearResultHash, handleSubmitResult } from "./result";
import { captureLanding } from "./tracking";
import { setupValidation } from "./validation";

captureLanding();

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll<HTMLFormElement>(".js-contact-form")
    .forEach((form) => {
      const inModal = form.closest(".js-contact-modal");
      setupValidation(
        form,
        inModal ? () => setModalReturnURL(form) : undefined,
      );
    });
  if (handleSubmitResult()) return;
  setupContactModal();
  // Last, as the result handler and the pop-up both read the hash
  clearResultHash();
});
