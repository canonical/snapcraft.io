import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { mockListingData } from "../../../../test-utils";
import LicenseInputs from "../LicenseInputs";
import LicenseSearch from "../LicenseSearch";
import { FieldValues, useForm } from "react-hook-form";
import { getDefaultListingData } from "../../../../utils";

jest.mock("../LicenseSearch");

function TestLicenseInputs() {
  const { register, setValue, watch } = useForm<FieldValues>({
    defaultValues: getDefaultListingData(mockListingData),
  });

  return (
    <form>
      <LicenseInputs
        listingData={mockListingData}
        register={register}
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

  return render(<TestLicenseInputs />);
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("LicenseInputs", () => {
  test("if license is simple the search is displayed", () => {
    renderComponent();
    expect(screen.getByLabelText("Simple")).toBeChecked();
    expect(screen.getByText(/^The license\(s\) under which/)).toBeVisible();
    expect(LicenseSearch).toHaveBeenCalled();
  });

  test("when switching license type to custom a textarea is displayed", async () => {
    renderComponent();
    const user = userEvent.setup();

    expect(screen.getByLabelText("Simple")).toBeChecked();
    await user.click(screen.getByLabelText("Custom SPDX expression"));
    expect(
      await screen.findByLabelText("Custom SPDX expression"),
    ).toBeChecked();
    expect(document.getElementsByTagName("textarea")).toHaveLength(1);
  });
});
