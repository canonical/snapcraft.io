import { FieldValues, useForm } from "react-hook-form";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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
  return render(<TestContactInformation />);
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
