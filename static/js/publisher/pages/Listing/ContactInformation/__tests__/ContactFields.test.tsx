import { FieldValues, useForm } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import ContactFields from "../ContactFields";
import userEvent from "@testing-library/user-event";
import { getDefaultListingData } from "../../../../utils";
import { mockListingData } from "../../../../test-utils";

function TestContactFields() {
  const { register, getValues, control } = useForm<FieldValues>({
    defaultValues: getDefaultListingData(mockListingData),
  });

  return (
    <form>
      <ContactFields
        register={register}
        control={control}
        labelName={"Contacts"}
        fieldName={"contacts"}
        getValues={getValues}
      />
    </form>
  );
}

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(<TestContactFields />);
}

describe("ContactFields", () => {
  test("data displayed and add field at the bottom", () => {
    renderComponent();

    const fieldElement = screen.getByDisplayValue(
      "https://example.com/contact",
    );
    const addFieldElement = screen.getByText(/Add field/);

    expect(fieldElement).toBeVisible();
    expect(addFieldElement).toBeVisible();
    expect(fieldElement.compareDocumentPosition(addFieldElement)).toEqual(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  test("data can be removed", async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButton = screen.getByRole("button", {
      name: "Remove this link",
    });
    expect(deleteButton).toBeVisible();

    await user.click(deleteButton);
    await waitFor(() => {
      const links = screen.queryAllByRole("textbox");
      expect(links).toHaveLength(0);
    });
  });

  test("data can be added", async () => {
    const user = userEvent.setup();
    renderComponent();

    const addButton = screen.getByText(/Add field/);
    await user.click(addButton);
    await waitFor(() => {
      const links = screen.queryAllByRole("textbox");
      expect(links).toHaveLength(2);
    });
  });
});
