import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { mockListingData } from "../../../../test-utils";
import AdditionalInformation from "../AdditionalInformation";

const useFormMocks = {
  register: jest.fn(),
  getValues: jest.fn(),
  setValue: jest.fn(),
  watch: jest.fn(),
};

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(
    <AdditionalInformation
      data={mockListingData}
      register={useFormMocks.register}
      getValues={useFormMocks.getValues}
      setValue={useFormMocks.setValue}
      watch={useFormMocks.watch}
    />,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("AdditionalInformation", () => {
  test("LicenseInputs is rendered", () => {
    renderComponent();
    expect(screen.getByText("License:")).toBeVisible();
    expect(screen.getByLabelText("Simple")).toBeVisible();
  });

  test("Fields displayed and registered with useForm", () => {
    renderComponent();
    expect(useFormMocks.register).toHaveBeenCalledTimes(3);
    expect(
      screen.getByLabelText("Display public popularity charts"),
    ).toBeVisible();
    expect(screen.getByLabelText("World map")).toBeVisible();
    expect(screen.getByLabelText("Linux distributions")).toBeVisible();
  });

  test("if public metrics is disabled all other fields are disabled", () => {
    useFormMocks.getValues.mockImplementation((valueKey: string) =>
      valueKey === "public_metrics_enabled" ? false : true,
    );
    renderComponent();
    expect(
      screen.getByRole("checkbox", { name: "public-metrics-checkbox" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "world-map-checkbox" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "linux-distributions-checkbox" }),
    ).toBeDisabled();
  });
});
