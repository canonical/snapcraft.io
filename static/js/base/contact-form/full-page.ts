import { contactFormFailed, contactFormSucceeded } from "./result";
import { restoreAnswers } from "./saved-answers";

export function setupFullPageResult(): void {
  const { pathname, hash } = window.location;

  if (pathname === "/about/thank-you") {
    if (hash === "#contact-form-fail") {
      window.location.replace("/about/contact-us#contact-form-fail");
    } else if (hash === "#contact-form-success") {
      contactFormSucceeded();
    }
  }

  if (pathname === "/about/contact-us" && hash === "#contact-form-fail") {
    const form = document.querySelector<HTMLFormElement>(".js-contact-form");
    if (form) restoreAnswers(form);
    const error = document.querySelector<HTMLElement>(".js-contact-error");
    if (error) error.hidden = false;
    contactFormFailed();
  }
}
