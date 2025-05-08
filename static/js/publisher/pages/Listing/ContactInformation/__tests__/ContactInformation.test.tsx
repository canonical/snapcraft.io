import { FieldValues, useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ContactInformation from "../ContactInformation";
import { mockListingData } from "../../../../test-utils";
import { QueryClient, QueryClientProvider } from "react-query";
import { getDefaultListingData } from "../../../../utils";

function TestContactInformation() {
  const { register, control, getFieldState, getValues } = useForm<FieldValues>({
    defaultValues: getDefaultListingData(mockListingData),
  });

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <form>
        <ContactInformation
          data={mockListingData}
          register={register}
          control={control}
          getFieldState={getFieldState}
          getValues={getValues}
        />
      </form>
    </QueryClientProvider>
  );
}

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

  return render(<TestContactInformation />);
}

describe("ContactInformation", () => {
  test("all fields are displayed", () => {
    renderComponent();
    expect(screen.getByLabelText(/^Primary website/)).toBeVisible();
    expect(screen.getByLabelText(/^Other websites/)).toBeVisible();
    expect(screen.getByLabelText(/^Contacts/)).toBeVisible();
    expect(screen.getByLabelText(/^Donations/)).toBeVisible();
    expect(screen.getByLabelText(/^Source code/)).toBeVisible();
    expect(screen.getByLabelText(/^Issues/)).toBeVisible();
  });
});
