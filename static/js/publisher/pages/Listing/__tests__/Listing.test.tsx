import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import Listing from "../Listing";
import { mockListingData } from "../../../test-utils/mockListingData";

const testListingData = {
  message: "",
  success: true,
  data: mockListingData,
};

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

const queryClient = new QueryClient();

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

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
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("Listing", () => {
  test("page title is set", async () => {
    renderComponent();
    await waitFor(() => {
      expect(document.title).toEqual("Listing data for test_id");
    });
  });

  test("heading is displayed", async () => {
    renderComponent();
    expect(
      await screen.findByRole("link", { name: "My snaps" }),
    ).toHaveProperty("href", "/snaps");
    expect(screen.findByRole("link", { name: "test_id" })).toHaveProperty(
      "href",
      "/test_id",
    );
    expect(await screen.findByText("Listing")).toBeInstanceOf(
      HTMLHeadingElement,
    );
  });

  test("ListingForm and PreviewForm are rendered", async () => {
    renderComponent();
    expect(await screen.findAllByRole("form")).toHaveLength(2);
  });

  test("isLoading is displayed while loading data", async () => {
    server.resetHandlers();
    server.use(
      http.get("/api/test_id/listing", async () => {
        await delay(500);
        return HttpResponse.json(testListingData);
      }),
    );

    const loadingText = "Loading test_id listing data";
    renderComponent();
    expect(screen.getByText(loadingText)).toBeVisible();
    // findByText uses waitFor under the hood
    await screen.findByText("Listing details");
    expect(screen.getByText(loadingText)).not.toBeInTheDocument();
  });

  test("on data error displays a notification", async () => {
    server.resetHandlers();
    server.use(
      http.get("/api/test_id/listing", () => {
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    renderComponent();
    const errorNotification = await screen.findByText("not available");
    expect(errorNotification).toBeVisible();
  });
});
