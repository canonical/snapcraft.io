import { buttonLoading, buttonDisable } from "../libs/formHelpers";

const MKTOFORM_ID = "mktoForm_3376";

function newsletter() {
  const holder = document.querySelector(".js-newsletter-signup");
  const form = document.getElementById(MKTOFORM_ID);

  if (!holder || !form) {
    return;
  }

  const button = form.querySelector("button");

  const signedUp = localStorage.getItem("newsletter-signup");
  if (signedUp) {
    const now = new Date().getTime();

    // 10minutes
    if (now - signedUp < 600000) {
      buttonDisable(button, "Subscribe now");
      const subscribed = document.createElement("span");
      subscribed.innerHTML = `&nbsp;<i class="p-icon--success"></i> Subscribed`;
      button.parentNode.appendChild(subscribed);
    } else {
      localStorage.removeItem("newsletter-signup");
    }
  }

  form.addEventListener("submit", () => {
    buttonLoading(button, "");
    localStorage.setItem("newsletter-signup", new Date().getTime());
  });
}

export { newsletter };
