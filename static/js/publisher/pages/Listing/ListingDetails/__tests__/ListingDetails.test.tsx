import { FieldValues, useForm } from "react-hook-form";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingDetails from "../ListingDetails";
import { mockListingData } from "../../../../test-utils";
import { getDefaultListingData } from "../../../../utils";

function TestListingDetails() {
  const { register, getValues, setValue, control, formState } =
    useForm<FieldValues>({
      defaultValues: getDefaultListingData(mockListingData),
    });

  return (
    <form>
      <ListingDetails
        data={mockListingData}
        register={register}
        getValues={getValues}
        setValue={setValue}
        control={control}
        formState={formState}
      />
    </form>
  );
}

function renderComponent() {
  return render(<TestListingDetails />);
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

describe("ListingDetails", () => {
  test("secondary category renders correct data", () => {
    renderComponent();

    expect(screen.getByLabelText("Secondary category: *")).toHaveValue(
      mockListingData.secondary_category,
    );
  });

  test("secondary category can be removed", async () => {
    renderComponent();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Remove secondary category" }),
    );

    expect(
      screen.queryByLabelText("Secondary category: *"),
    ).not.toBeInTheDocument();
  });
});
