import { FieldValues, useForm } from "react-hook-form";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingDetails from "../ListingDetails";
import { mockListingData } from "../../../../test-utils";
import { getDefaultListingData } from "../../../../utils";

function TestImageUpload() {
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
  return render(
    <MemoryRouter initialEntries={["/test_id/listing"]}>
      <Routes>
        <Route path="/:snapId/listing" element={<TestImageUpload />} />
      </Routes>
    </MemoryRouter>,
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

describe("ImageUpload", () => {
  test("icon is displayed on page", () => {
    renderComponent();

    const iconUpload = within(
      screen.getByText("Snap icon:").closest(".p-form__group") as HTMLElement,
    );
    expect(iconUpload.getByAltText("test_id icon")).toBeInTheDocument();
  });

  test("icon can be removed", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(screen.getByRole("button", { name: "Remove icon" }));
    const iconUpload = within(
      screen.getByText("Snap icon:").closest(".p-form__group") as HTMLElement,
    );
    expect(iconUpload.queryByAltText("test_id icon")).not.toBeInTheDocument();
  });

  test("icon image restrictions toggle works", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByRole("button", {
        name: "Show image restrictions for icon",
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: "Show image restrictions for icon",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Hide image restrictions for icon",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Hide image restrictions for icon",
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: "Hide image restrictions for icon",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Show image restrictions for icon",
      }),
    ).toBeInTheDocument();
  });
});
