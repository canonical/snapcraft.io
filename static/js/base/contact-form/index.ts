import { setupStateField } from "./state-field";
import { setupValidation } from "./validation";

export function setupContactForm(form: HTMLFormElement): void {
  setupStateField(form);
  setupValidation(form);
}
