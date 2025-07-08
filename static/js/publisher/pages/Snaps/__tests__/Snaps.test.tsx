import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  JotaiTestProvider,
  brandStoreRequests,
  storesResponse,
} from "../../../test-utils";

import Snaps from "../Snaps";

import { brandStoresState } from "../../../state/brandStoreState";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      id: "test-store-id",
    }),
  };
});

const queryClient = new QueryClient();

function renderComponent() {
  return render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <JotaiTestProvider
            initialValues={[[brandStoresState, storesResponse]]}
          >
            <Snaps />
          </JotaiTestProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </RecoilRoot>,
  );
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  brandStoreRequests(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("Snaps", () => {
  test("shows correct store name in title", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Test store / Store snaps",
        }),
      ).toBeInTheDocument();
    });
  });

  test("populates snaps in store table", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("gridcell", { name: "test-snap-name" }),
      ).toBeInTheDocument();
    });
  });

  test("populates included snaps table", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByLabelText("test-snap-name-included"),
      ).toBeInTheDocument();
    });
  });

  test("search filters snaps table", async () => {
    renderComponent();

    const user = userEvent.setup();

    await waitFor(() => {
      user.type(screen.getByLabelText("Search snaps"), "e-2");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("gridcell", { name: "test-snap-name-2" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("gridcell", { name: "test-snap-name" }),
      ).not.toBeInTheDocument();
    });
  });
});
