import { contactFormFailed, contactFormSucceeded } from "./result";
import { restoreAnswers } from "./saved-answers";

export function setupFullPageResult(): void {
  const { pathname, hash } = window.location;

  if (pathname === "/about/thank-you") {
    if (hash === "#contact-form-fail") {
      window.location.replace("/about/contact-us/error#contact-form-fail");
    } else if (hash === "#contact-form-success") {
      contactFormSucceeded();
    }
  }

  if (pathname === "/about/contact-us/error" && hash === "#contact-form-fail") {
    contactFormFailed();
  }

  if (pathname === "/about/contact-us") {
    const form = document.querySelector<HTMLFormElement>(".js-contact-form");
    if (form) restoreAnswers(form);
  }
}
