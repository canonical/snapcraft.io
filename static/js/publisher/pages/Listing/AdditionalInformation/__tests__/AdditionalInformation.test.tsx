import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import "@testing-library/jest-dom";

import { mockListingData } from "../../../../test-utils";
import AdditionalInformation from "../AdditionalInformation";
import { FieldValues, useForm } from "react-hook-form";
import { getDefaultListingData } from "../../../../utils";

function TestAdditionalInformation() {
  const { register, setValue, watch, getValues } = useForm<FieldValues>({
    defaultValues: getDefaultListingData(mockListingData),
  });

  return (
    <form>
      <AdditionalInformation
        data={mockListingData}
        register={register}
        getValues={getValues}
        setValue={setValue}
        watch={watch}
      />
    </form>
  );
}

function renderComponent() {
  return render(<TestAdditionalInformation />);
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
  jest.clearAllMocks();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("AdditionalInformation", () => {
  test("LicenseInputs is rendered", () => {
    renderComponent();
    expect(screen.getByText("License:")).toBeVisible();
    expect(screen.getByLabelText("Simple")).toBeVisible();
  });

  test("Fields displayed and registered with useForm", () => {
    renderComponent();
    expect(
      screen.getByLabelText("Display public popularity charts"),
    ).toBeVisible();
    expect(screen.getByLabelText("World map")).toBeVisible();
    expect(screen.getByLabelText("Linux distributions")).toBeVisible();
  });

  test("if public metrics is unchecked all other fields are disabled", () => {
    renderComponent();
    expect(
      screen.getByRole("checkbox", {
        name: "Display public popularity charts",
      }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "World map" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Linux distributions" }),
    ).toBeDisabled();
  });
});
