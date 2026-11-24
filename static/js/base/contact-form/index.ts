import { setupFullPageResult } from "./full-page";
import { setupStateField } from "./state-field";
import { captureLanding } from "./tracking";
import { setupValidation } from "./validation";

export function setupContactForm(form: HTMLFormElement): void {
  setupStateField(form);
  setupValidation(form);
}

captureLanding();
document
  .querySelectorAll<HTMLFormElement>(".js-contact-form")
  .forEach(setupContactForm);
setupFullPageResult();
