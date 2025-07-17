import { FieldValues, useForm } from "react-hook-form";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

const server = setupServer();

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  server.use(
    http.get("/api/test_id/verify", () => {
      return HttpResponse.json({
        primary_domain: true,
        token: "test-dns-verification-token",
      });
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function renderComponent() {
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
