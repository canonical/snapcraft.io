import { Control, FieldValues } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ContactInformation from "../ContactInformation";
import { mockListingData } from "../../../../test-utils";

const mocks = {
  register: jest.fn(),
  control: {} as Control<FieldValues>,
  getFieldState: jest.fn(),
  getValues: jest.fn(),
};

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(
    <ContactInformation
      data={mockListingData}
      register={mocks.register}
      control={mocks.control}
      getFieldState={mocks.getFieldState}
      getValues={mocks.getValues}
    />,
  );
}

describe("ContactInformation", () => {
  test("all fields are displayed", () => {
    renderComponent();
    expect(screen.getByLabelText("Primary website:")).toBeVisible();
    expect(screen.getByLabelText("Other websites")).toBeVisible();
    expect(screen.getByLabelText("Contacts")).toBeVisible();
    expect(screen.getByLabelText("Donations")).toBeVisible();
    expect(screen.getByLabelText("Source code")).toBeVisible();
    expect(screen.getByLabelText("Issues")).toBeVisible();
  });
});
