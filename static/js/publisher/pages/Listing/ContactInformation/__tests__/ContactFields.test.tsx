import { Control, FieldValues } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import ContactFields from "../ContactFields";
import userEvent from "@testing-library/user-event";

const propsMocks = {
  register: jest.fn(),
  control: {} as Control<FieldValues>,
  getValues: jest.fn(),
};

const useFieldArrayMock = jest.fn();

jest.mock("react-hook-form", () => ({
  ...jest.requireActual("react-hook-form"),
  useFieldArray: useFieldArrayMock,
}));

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(
    <ContactFields
      register={propsMocks.register}
      control={propsMocks.control}
      labelName={"Test"}
      fieldName={"test"}
      getValues={propsMocks.getValues}
    />,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("ContactFields", () => {
  test("when no data, add field is displayed", () => {
    const useFieldArrayResult = {
      fields: [],
      append: jest.fn(),
      remove: jest.fn(),
    };
    useFieldArrayMock.mockReturnValue(useFieldArrayResult);
    renderComponent();

    expect(screen.getByRole("button", { name: "Add field" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove this link" }),
    ).not.toBeInTheDocument();
  });

  test("data displayed and add field at the bottom", () => {
    const exampleUrl = "https://example.com/contact";
    const useFieldArrayResult = {
      fields: [{ url: exampleUrl }],
      append: jest.fn(),
      remove: jest.fn(),
    };
    useFieldArrayMock.mockReturnValue(useFieldArrayResult);
    propsMocks.getValues.mockReturnValue(exampleUrl);
    renderComponent();

    const fieldElement = screen.getByDisplayValue(exampleUrl);
    const addFieldElement = screen.getByRole("button", { name: "Add field" });
    expect(fieldElement).toBeVisible();
    expect(addFieldElement).toBeVisible();
    expect(fieldElement.compareDocumentPosition(addFieldElement)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  test("data can be removed", async () => {
    const exampleUrl = "https://example.com/contact";
    const useFieldArrayResult = {
      fields: [{ url: exampleUrl }],
      append: jest.fn(),
      remove: jest.fn(),
    };
    useFieldArrayMock.mockReturnValue(useFieldArrayResult);
    propsMocks.getValues.mockReturnValue(exampleUrl);
    const user = userEvent.setup();
    renderComponent();

    const deleteButton = screen.getByRole("button", {
      name: "Remove this link",
    });
    expect(deleteButton).toBeVisible();

    await user.click(deleteButton);
    await waitFor(() => expect(useFieldArrayResult.remove).toHaveBeenCalled());
  });

  test("data can be added", async () => {
    const useFieldArrayResult = {
      fields: [],
      append: jest.fn(),
      remove: jest.fn(),
    };
    useFieldArrayMock.mockReturnValue(useFieldArrayResult);
    const user = userEvent.setup();
    renderComponent();

    const addButton = screen.getByRole("button", { name: "Add field" });
    await user.click(addButton);
    await waitFor(() => expect(useFieldArrayResult.append).toHaveBeenCalled());
  });
});
