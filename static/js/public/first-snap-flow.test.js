import firstSnapFlow from "./first-snap-flow";

describe("initChooseName", () => {
  let formEl;
  let validationEl;
  let nameInput;
  let submitButton;

  var _window = window,
    location = _window.location;

  function setupForm() {
    formEl = document.createElement("form");
    formEl.id = "test-form";

    validationEl = document.createElement("div");

    nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.name = "snap-name";

    submitButton = document.createElement("button");
    submitButton.disabled = true;

    validationEl.appendChild(nameInput);
    formEl.appendChild(validationEl);
    formEl.appendChild(submitButton);

    document.body.appendChild(formEl);
  }

  beforeEach(() => {
    setupForm();
    firstSnapFlow.initChooseName(formEl, "python");
  });

  afterEach(() => {
    formEl.parentNode.removeChild(formEl);
    window.location = location;
  });

  it("should mark field invalid", () => {
    nameInput.click();
    nameInput.value = "-invalid";
    nameInput.dispatchEvent(new Event("keyup", { bubbles: true }));

    expect(submitButton.disabled).toBe(true);
    expect(validationEl.classList.contains("is-error")).toBe(true);
  });

  it("should mark field valid", () => {
    nameInput.click();
    nameInput.value = "valid-name";
    nameInput.dispatchEvent(new Event("keyup", { bubbles: true }));

    expect(submitButton.disabled).toBe(false);
    expect(validationEl.classList.contains("is-error")).toBe(false);
  });

  it("should set cookie on submit", () => {
    delete window.location;
    window.location = { reload: vi.fn() };

    nameInput.click();
    nameInput.value = "valid-name";

    formEl.dispatchEvent(new Event("submit", { bubbles: true }));
    expect(document.cookie).toContain("fsf_snap_name_python=valid-name");
    expect(window.location.reload).toHaveBeenCalled();
  });
});
