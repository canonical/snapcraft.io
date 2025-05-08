import { FieldValues, useForm } from "react-hook-form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingDetails from "../ListingDetails";
import { mockListingData } from "../../../../test-utils";
import { getDefaultListingData } from "../../../../utils";

function TestImageUpload() {
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

  return render(<TestImageUpload />);
}

describe("ImageUpload", () => {
  test("icon is displayed on page", () => {
    renderComponent();

    waitFor(() => {
      expect(screen.getByAltText("test_id icon")).toBeInTheDocument();
    });
  });

  test("icon can be removed", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(async () => {
      await user.click(screen.getByRole("button", { name: "Remove icon" }));
      expect(screen.queryByAltText("test_id icon")).not.toBeInTheDocument();
    });
  });

  test("icon image restrictions toggle works", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(async () => {
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
});
