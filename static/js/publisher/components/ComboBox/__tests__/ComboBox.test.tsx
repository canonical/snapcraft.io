import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ComboBox, { ComboBoxProps } from "../ComboBox";

let elements: {
  combobox: HTMLElement;
  input: HTMLInputElement;
  button: HTMLButtonElement;
  label: HTMLElement;
  listbox: HTMLElement;
};

let actions: {
  toggle: () => Promise<void>;
  focus: () => Promise<void>;
};

const onChange = vi.fn();
const options = Array(5)
  .fill(undefined)
  .map((_, i) => ({
    value: `option-${i}`,
    label: `Option ${i}`,
  }));

function renderComponent(props?: Partial<ComboBoxProps>) {
  const renderResult = render(
    <ComboBox
      options={options}
      placeholder="Test combobox placeholder"
      label="Test combobox label"
      labelClassName="test-combobox__label"
      value={""}
      onChange={onChange}
      {...(props ?? {})}
    />,
  );

  const combobox = screen.getByRole("combobox");
  const input = combobox.querySelector("input")!;
  const button = combobox.querySelector("button")!;
  const label = screen.getByText(/label/);
  const listbox = screen.getByRole("listbox");

  elements = { combobox, input, button, label, listbox };

  const user = userEvent.setup();

  const toggle = async () => user.click(elements.input);
  const focus = async () => input.focus();
  actions = { toggle, focus };

  return renderResult;
}

describe("ComboBox", () => {
  beforeEach(() => {
    onChange.mockClear();
    document.body.innerHTML = "";
    // @ts-expect-error: resetting
    elements = undefined;
    // @ts-expect-error: resetting
    actions = undefined;
  });

  it("displays all necessary parts", () => {
    renderComponent();
    expect(elements.combobox).toBeInTheDocument();
    expect(elements.input).toBeInTheDocument();
    expect(elements.button).toBeInTheDocument();
    expect(elements.label).toBeInTheDocument();
    expect(elements.listbox).toBeInTheDocument();
  });

  it("combobox has the correct attributes", () => {
    renderComponent();
    expect(elements.combobox).toHaveAttribute("aria-haspopup", "listbox");
    expect(elements.combobox).toHaveAttribute("aria-labelledby");
  });

  it("combobox contains an input and a button", () => {
    renderComponent();
    expect(elements.input).toBeInTheDocument();
    expect(elements.button).toBeInTheDocument();
    expect(elements.combobox).toContainHTML(elements.input.outerHTML);
    expect(elements.combobox).toContainHTML(elements.button.outerHTML);
  });

  it("combobox input has the correct attributes", () => {
    renderComponent();
    expect(elements.input).toHaveAttribute(
      "aria-labelledby",
      elements.label.id,
    );
    expect(elements.input).toHaveAttribute("aria-autocomplete", "list");
    expect(elements.input).toHaveAttribute(
      "placeholder",
      "Test combobox placeholder",
    );
  });

  it("combobox button has the correct attributes", () => {
    renderComponent();
    expect(elements.button).toHaveAttribute("aria-label", "open menu");
    expect(elements.button).toHaveAttribute("aria-haspopup", "true");
    expect(elements.button).toHaveAttribute("tabindex", "-1");
  });

  it("label references the combobox input", () => {
    renderComponent();
    expect(elements.label).toHaveAttribute("for", elements.input.id);
  });

  it("listbox has correct attributes", () => {
    renderComponent();
    expect(elements.input).toHaveAttribute(
      "aria-labelledby",
      elements.label.id,
    );
  });

  it("listbox is toggled on and off when clicking on the input", async () => {
    renderComponent();
    const user = userEvent.setup();

    // toggle on
    await user.click(elements.input);
    await waitFor(() => {
      expect(elements.listbox).toHaveClass("active");
      expect(elements.listbox.children.length).toBeGreaterThan(0);
    });

    // toggle off
    await user.click(elements.input);
    await waitFor(() => {
      expect(elements.listbox).not.toHaveClass("active");
      expect(elements.listbox.children.length).toBe(0);
    });
  });

  it("listbox is toggled on and off when clicking on the button", async () => {
    renderComponent();
    const user = userEvent.setup();

    // toggle on
    await user.click(elements.button);
    await waitFor(() => {
      expect(elements.listbox).toHaveClass("active");
      expect(elements.listbox.children.length).toBeGreaterThan(0);
    });

    // toggle off
    await user.click(elements.button);
    await waitFor(() => {
      expect(elements.listbox).not.toHaveClass("active");
      expect(elements.listbox.children.length).toBe(0);
    });
  });

  it("combobox has the correct attributes when toggled on", async () => {
    renderComponent();
    await actions.toggle();

    await waitFor(() => {
      // combobox element state
      expect(elements.combobox).toHaveAttribute("aria-expanded", "true");
      expect(elements.combobox).toHaveAttribute(
        "aria-owns",
        elements.listbox.id,
      );

      // input element state
      expect(elements.input).toHaveAttribute(
        "aria-controls",
        elements.listbox.id,
      );

      // toggle button element state
      expect(elements.button).toHaveAttribute("aria-label", "close menu");
    });
  });

  it("listbox is toggled on when user writes", async () => {
    renderComponent();
    await userEvent.type(elements.input, "Option");

    expect(elements.listbox).toHaveClass("active");
    expect(elements.listbox.children.length).toBeGreaterThan(0);
  });

  it("listbox is filtered when user writes", async () => {
    renderComponent();
    await userEvent.type(elements.input, "1");

    expect(elements.listbox.children.length).toBe(1);
  });

  it("listbox is not filtered when opening for the first time after setting a value", async () => {
    renderComponent({ value: "option-1" });
    await actions.toggle();

    expect(elements.listbox.children.length).toBe(5);
  });

  it("listbox does filter when changing input even with a value already set", async () => {
    renderComponent({ value: "option-1" });

    await userEvent.clear(elements.input);
    await userEvent.type(elements.input, "1");

    expect(elements.listbox.children.length).toBe(1);
  });

  it("arrow keys open the listbox", async () => {
    renderComponent();

    expect(elements.listbox).not.toHaveClass("active");

    await userEvent.type(elements.input, "{arrowdown}");

    expect(elements.listbox).toHaveClass("active");
    expect(elements.listbox.children.length).toBeGreaterThan(0);
  });

  it("arrow keys select items in the listbox", async () => {
    renderComponent();

    await userEvent.type(elements.input, "{arrowdown}");

    const firstOption = elements.listbox.firstChild! as HTMLLIElement;

    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(elements.input).toHaveAttribute(
      "aria-activedescendant",
      firstOption.id,
    );
  });

  it("escape closes the listbox", async () => {
    renderComponent();
    await actions.toggle();

    await userEvent.type(elements.input, "{escape}");

    expect(elements.listbox).not.toHaveClass("active");
    expect(elements.listbox.children.length).toBe(0);
  });

  it("combobox state update when hovering items in the listbox", async () => {
    renderComponent();
    await actions.toggle();

    const firstOption = elements.listbox.firstChild! as HTMLLIElement;
    await userEvent.hover(firstOption);

    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(elements.input).toHaveAttribute(
      "aria-activedescendant",
      firstOption.id,
    );
  });

  it("doesn't trigger onChange on mount", () => {
    renderComponent();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("enter selects an element", async () => {
    renderComponent();
    await userEvent.type(elements.input, "{arrowdown}{enter}");

    // listbox closes
    expect(elements.listbox).not.toHaveClass("active");
    // value changes
    expect(elements.input.value).toEqual("Option 0");
    // callback is called
    expect(onChange).toHaveBeenCalledWith("option-0");
  });

  it("blurring selects an element", async () => {
    renderComponent();
    await userEvent.type(elements.input, "{arrowdown}{tab}");

    // listbox closes
    expect(elements.listbox).not.toHaveClass("active");
    // value changes
    expect(elements.input.value).toEqual("Option 0");
    // callback is called
    expect(onChange).toHaveBeenCalledWith("option-0");
  });

  it("arrow key navigation loops at the bottom", async () => {
    renderComponent();
    await userEvent.type(elements.input, "{arrowdown}".repeat(options.length));

    const lastOption = elements.listbox.lastChild! as HTMLLIElement;
    expect(lastOption).toHaveAttribute("aria-selected", "true");
  });

  it("arrow key navigation loops at the top", async () => {
    renderComponent();
    await userEvent.type(elements.input, "{arrowdown}{arrowup}");

    expect(elements.listbox.lastChild).toHaveAttribute("aria-selected", "true");
  });
});
