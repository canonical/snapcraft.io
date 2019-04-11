import { buttonLoading } from "../libs/formHelpers";

const MKTOFORM_ID = "mktoForm_3376";

function newsletter() {
  const form = document.getElementById(MKTOFORM_ID);

  if (!form) {
    return;
  }

  const button = form.querySelector("button");

  form.addEventListener("submit", () => {
    buttonLoading(button, "");
  });
}

export { newsletter };
