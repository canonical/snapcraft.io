import { FieldValues, useForm } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingDetails from "../ListingDetails";
import { mockListingData } from "../../../../test-utils";
import { getDefaultListingData } from "../../../../utils";

function TestListingDetails() {
  const { register, getValues, setValue, control } = useForm<FieldValues>({
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
      />
    </form>
  );
}

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(<TestListingDetails />);
}

describe("ListingDetails", () => {
  test("secondary category renders correct data", () => {
    renderComponent();

    waitFor(() => {
      expect(screen.getByLabelText("Secondary category:")).toHaveValue(
        mockListingData.secondary_category,
      );
    });
  });

  test("secondary category can be removed", () => {
    renderComponent();

    waitFor(async () => {
      const user = userEvent.setup();

      renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Remove secondary category" }),
      );

      expect(
        screen.queryByLabelText("Secondary category:"),
      ).not.toBeInTheDocument();
    });
  });
});
