import { render, screen } from "@testing-library/react";
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
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(<TestAdditionalInformation />);
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
