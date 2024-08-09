const MARKETO_FORM_ID = 3308;

function nps(): void {
  const MktoForms2 = window.MktoForms2 || (null as unknown | null);

  const toggle = document.querySelector(
    ".js-nps-comment-toggle"
  ) as HTMLElement;
  if (!MktoForms2) {
    toggle.classList.add("u-hide");
    return;
  }
  const commentHolder = document.querySelector(
    ".js-nps-comment"
  ) as HTMLElement;
  const form = commentHolder.querySelector("form") as HTMLFormElement;
  const button = form.querySelector("button") as HTMLButtonElement;
  const fakeForm = document.createElement("form");
  fakeForm.setAttribute("id", `mktoForm_${MARKETO_FORM_ID}`);
  fakeForm.setAttribute("class", "u-hide");

  commentHolder.appendChild(fakeForm);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  fakeForm.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    commentHolder.classList.toggle("u-hide");
  });
  MktoForms2.loadForm(
    "//app-sjg.marketo.com",
    "066-EOV-335",
    MARKETO_FORM_ID,
    (mktoForm: HTMLFormElement) => {
      mktoForm.onSuccess(() => {
        commentHolder.classList.add("u-hide");
        toggle.classList.add("u-hide");
        return false;
      });
      form.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const name = target.name;
        const value = target.value;

        mktoForm.setValues({
          [name]: value,
        });
      });

      form.addEventListener("submit", () => {
        button.innerHTML = `<i class="p-icon--spinner u-animation--spin"></i>`;
        mktoForm.submit();
      });
    }
  );
}

export default nps;
