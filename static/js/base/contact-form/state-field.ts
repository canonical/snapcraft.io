const STATE_COUNTRIES = ["US", "CA"];

export function setupStateField(form: HTMLFormElement): void {
  const country = form.querySelector<HTMLSelectElement>('[name="country"]');
  const state = form.querySelector<HTMLSelectElement>('[name="State"]');
  const wrapper = form.querySelector<HTMLElement>(".js-state-field");

  if (!country || !state || !wrapper) return;

  const update = () => {
    const show = STATE_COUNTRIES.includes(country.value);
    wrapper.hidden = !show;
    state.required = show;
    // Disabled fields are not submitted
    state.disabled = !show;
    state
      .querySelectorAll<HTMLOptGroupElement>("optgroup[data-country]")
      .forEach((group) => {
        const other = group.dataset.country !== country.value;
        group.hidden = other;
        group.disabled = other;
      });
    const selected = state.selectedOptions[0]?.parentElement;
    if (selected instanceof HTMLOptGroupElement && selected.disabled) {
      state.value = "";
    }
  };

  country.addEventListener("change", update);
  update();
}
