import submitEnabler from "./submitEnabler";

describe("submitEnabler", () => {
  let form;
  let buttons = [];
  let input;

  beforeEach(() => {
    form = document.createElement("form");
    form.className = "test-form";

    input = document.createElement("input");
    input.type = "text";
    input.name = "an-input";
    input.value = "hi";

    form.appendChild(input);

    for (let i = 0; i < 4; i += 1) {
      buttons.push(document.createElement("button"));
      buttons[i].className = `test-form-button-${i}`;
      form.appendChild(buttons[i]);
    }

    document.body.appendChild(form);
  });

  afterEach(() => {
    document.body.removeChild(form);
    buttons = [];
  });

  it("should throw if no form selector is provided", () => {
    expect(() => {
      submitEnabler();
    }).toThrow("`formSelector` argument is required");
  });

  it("should throw if the form selector is invalid", () => {
    expect(() => {
      submitEnabler(".form", [".test"]);
    }).toThrow(".form is not a valid element");
  });

  it("should throw if no button selectors are provided", () => {
    expect(() => {
      submitEnabler(".test-form");
    }).toThrow("At least one `buttonSelectors` must be defined");

    expect(() => {
      submitEnabler(".test-form", []);
    }).toThrow("At least one `buttonSelectors` must be defined");
  });

  it("should set provided buttons to disabled", () => {
    const button1 = document.querySelector(".test-form-button-0");
    const button2 = document.querySelector(".test-form-button-1");
    const button3 = document.querySelector(".test-form-button-2");
    const button4 = document.querySelector(".test-form-button-3");

    expect(button1.getAttribute("disabled")).toBeNull();
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toBeNull();
    expect(button4.getAttribute("disabled")).toBeNull();

    submitEnabler(".test-form", [".test-form-button-0", ".test-form-button-2"]);

    expect(button1.getAttribute("disabled")).toEqual("disabled");
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toEqual("disabled");
    expect(button4.getAttribute("disabled")).toBeNull();
  });

  it("should enable the passed buttons when the form changes", () => {
    const button1 = document.querySelector(".test-form-button-0");
    const button2 = document.querySelector(".test-form-button-1");
    const button3 = document.querySelector(".test-form-button-2");
    const button4 = document.querySelector(".test-form-button-3");

    expect(button1.getAttribute("disabled")).toBeNull();
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toBeNull();
    expect(button4.getAttribute("disabled")).toBeNull();

    submitEnabler(".test-form", [".test-form-button-0", ".test-form-button-2"]);

    expect(button1.getAttribute("disabled")).toEqual("disabled");
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toEqual("disabled");
    expect(button4.getAttribute("disabled")).toBeNull();

    input.value = "bye";
    form.dispatchEvent(new Event("change"));

    expect(button1.getAttribute("disabled")).toBeNull();
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toBeNull();
    expect(button4.getAttribute("disabled")).toBeNull();
  });

  it("should disable the passed buttons when the form changes back to initial values", () => {
    const button1 = document.querySelector(".test-form-button-0");
    const button2 = document.querySelector(".test-form-button-1");
    const button3 = document.querySelector(".test-form-button-2");
    const button4 = document.querySelector(".test-form-button-3");

    expect(button1.getAttribute("disabled")).toBeNull();
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toBeNull();
    expect(button4.getAttribute("disabled")).toBeNull();

    submitEnabler(".test-form", [".test-form-button-0", ".test-form-button-2"]);

    expect(button1.getAttribute("disabled")).toEqual("disabled");
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toEqual("disabled");
    expect(button4.getAttribute("disabled")).toBeNull();

    input.value = "bye";
    form.dispatchEvent(new Event("change"));

    expect(button1.getAttribute("disabled")).toBeNull();
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toBeNull();
    expect(button4.getAttribute("disabled")).toBeNull();

    input.value = "hi";
    form.dispatchEvent(new Event("change"));

    expect(button1.getAttribute("disabled")).toEqual("disabled");
    expect(button2.getAttribute("disabled")).toBeNull();
    expect(button3.getAttribute("disabled")).toEqual("disabled");
    expect(button4.getAttribute("disabled")).toBeNull();
  });
});
