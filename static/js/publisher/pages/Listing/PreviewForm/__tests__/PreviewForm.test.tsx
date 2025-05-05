import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Listing from "../../Listing";
import { mockListingData } from "../../../../test-utils";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

const testListingData = {
  message: "",
  success: true,
  data: mockListingData,
};

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Listing />
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
    http.get("/api/test_id/listing", () => {
      return HttpResponse.json(testListingData);
    }),
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

const expectedListingData = {};

describe("PreviewForm", async () => {
  test("PreviewForm status matches ListingForm data", async () => {
    const user = userEvent.setup();
    renderComponent();
    const stateInput = screen.getByTestId("state-input") as HTMLInputElement;

    const title = screen.getByLabelText("Title");
    const summary = screen.getByLabelText("Summary");
    const description = screen.getByLabelText("Description");
    const category = screen.getByLabelText("Category");
    const secondaryCategory = screen.getByLabelText("Secondary category");
    const primaryWebsite = screen.getByLabelText("Primary website");
    const iconDeleteButton = screen.getByRole("button", {
      name: "Remove icon",
    });

    // change all the properties
    await user.type(title, "title modified");
    await user.type(summary, "summary modified");
    await user.type(description, "description modified");
    await user.selectOptions(category, "test-select");
    await user.selectOptions(secondaryCategory, "test-select-secondary");
    await user.type(primaryWebsite, "https://www.modified.com");
    await user.click(iconDeleteButton);

    expect(stateInput.value).toEqual(JSON.stringify(expectedListingData));
  });
});
