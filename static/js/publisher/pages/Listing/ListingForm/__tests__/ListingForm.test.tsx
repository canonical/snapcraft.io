import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ListingForm from "../ListingForm";
import { mockListingData } from "../../../../test-utils";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

function renderComponent(updateMetadataOnRelease = false) {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };
  const data = {
    ...mockListingData,
    update_metadata_on_release: updateMetadataOnRelease,
  };
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ListingForm data={data} refetch={jest.fn()} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  server.use(
    http.post("/api/test_id/listing", () => {
      return HttpResponse.json({ success: true }, { status: 200 });
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("ListingForm", () => {
  test("Tour is rendered", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Start tour" })).toBeVisible();
  });

  test("notification displayed when update_metadata_on_release", () => {
    renderComponent(true);
    expect(
      screen.getByText(/Information here was automatically/),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeVisible();
  });

  test("ListingDetails is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Listing details" }),
    ).toBeVisible();
  });

  test("ContactInformation is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeVisible();
  });

  test("AdditionalInformation is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Additional information" }),
    ).toBeVisible();
  });

  test("PreviewForm is rendered", () => {
    renderComponent();
    expect(document.getElementById("preview-form")).toBeVisible();
  });
});
