import { getByText, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { mockListingData } from "../../../../test-utils";
import LicenseSearch from "../LicenseSearch";

const mocks = {
  register: jest.fn(),
  setValue: jest.fn(),
  setLicense: jest.fn(),
};

function renderComponent(license = mockListingData.license) {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(
    <LicenseSearch
      licenses={mockListingData.licenses}
      license={license}
      register={mocks.register}
      setValue={mocks.setValue}
      setLicense={mocks.setLicense}
      originalLicense={mockListingData.license}
    />,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("LicenseSearch", () => {
  test("the search field displays the currently selected license", () => {
    renderComponent();
    expect(screen.getByText("testing-license")).toBeVisible();
  });

  test("click on search field opens list of licenses", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(
      document.getElementsByClassName("p-multiselect__input").item(0)!,
    );

    const suggestions = await waitFor(() => {
      const suggestionsElem = document.getElementsByClassName("p-list");
      expect(suggestionsElem).toBeVisible();
      expect(suggestionsElem).toHaveLength(1);
      return suggestionsElem[0] as HTMLUListElement;
    });
    expect(getByText(suggestions, "random-license")).toBeVisible();
    // the current license should be filtered and not displayed in the dropdown
    expect(getByText(suggestions, "testing-license")).not.toBeInTheDocument();
  });

  test("removing focus from search field closes the licenses list", async () => {
    const { container } = renderComponent();
    const user = userEvent.setup();
    await user.click(
      document.getElementsByClassName("p-multiselect__input").item(0)!,
    );

    expect(await screen.findByText("random-license")).toBeVisible();
    user.click(container);
    expect(await screen.findByText("random-license")).not.toBeVisible();
  });

  test("remove license from list", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("testing-license")).not.toBeVisible();
    expect(mocks.setLicense).toHaveBeenCalled();
    expect(mocks.setValue).toHaveBeenCalled();
  });
});
