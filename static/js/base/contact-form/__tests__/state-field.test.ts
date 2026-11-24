import { setupStateField } from "../state-field";

function renderForm() {
  document.body.innerHTML = `
    <form>
      <select id="country" name="country">
        <option value="">Select...</option>
        <option value="US">United States of America</option>
        <option value="CA">Canada</option>
        <option value="NL">Netherlands</option>
      </select>
      <div class="js-state-field">
        <select id="State" name="State">
          <option value="">Select...</option>
          <optgroup data-country="CA"><option value="ON">Ontario</option></optgroup>
          <optgroup data-country="US"><option value="TX">Texas</option></optgroup>
        </select>
      </div>
    </form>
  `;
  const form = document.querySelector("form") as HTMLFormElement;
  setupStateField(form);
  return form;
}

function selectCountry(form: HTMLFormElement, value: string) {
  const country = form.querySelector("#country") as HTMLSelectElement;
  country.value = value;
  country.dispatchEvent(new Event("change"));
}

const stateWrapper = () =>
  document.querySelector(".js-state-field") as HTMLElement;
const stateSelect = () => document.querySelector("#State") as HTMLSelectElement;
const group = (country: string) =>
  stateSelect().querySelector(
    `optgroup[data-country='${country}']`,
  ) as HTMLOptGroupElement;

describe("State field", () => {
  it.each(["US", "CA"])("is shown and required for %s", (code) => {
    const form = renderForm();
    selectCountry(form, code);

    expect(stateWrapper().hidden).toBe(false);
    expect(stateSelect().required).toBe(true);
    expect(stateSelect().disabled).toBe(false);
  });

  it.each([
    ["US", "CA"],
    ["CA", "US"],
  ])("shows only that country's options for %s", (shown, hidden) => {
    const form = renderForm();
    selectCountry(form, shown);

    expect(group(shown).hidden).toBe(false);
    expect(group(shown).disabled).toBe(false);
    expect(group(hidden).hidden).toBe(true);
    expect(group(hidden).disabled).toBe(true);
  });

  it("clears a state from the other country when the country changes", () => {
    const form = renderForm();
    selectCountry(form, "CA");
    stateSelect().value = "ON";
    selectCountry(form, "US");

    expect(stateSelect().value).toBe("");
  });

  it("is hidden for other countries", () => {
    const form = renderForm();
    selectCountry(form, "NL");

    expect(stateWrapper().hidden).toBe(true);
  });

  it("is not required and not sent when hidden", () => {
    const form = renderForm();
    selectCountry(form, "US");
    stateSelect().value = "TX";
    selectCountry(form, "NL");

    expect(stateSelect().required).toBe(false);
    expect(new FormData(form).has("State")).toBe(false);
  });
});
