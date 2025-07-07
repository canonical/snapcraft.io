function buttonLoading(button: HTMLButtonElement, text: string): void {
  button.disabled = true;
  button.classList.add("--dark");
  button.innerHTML = `<i class='p-icon--spinner u-animation--spin'></i> ${text}`;
}

function buttonEnabled(button: HTMLButtonElement, text: string): void {
  button.disabled = false;
  button.classList.remove("--dark");
  button.innerHTML = text;
}

function buttonDisable(button: HTMLButtonElement, text: string): void {
  button.disabled = true;
  button.innerHTML = text;
}

export { buttonLoading, buttonEnabled, buttonDisable };
