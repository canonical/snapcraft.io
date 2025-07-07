import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  RecoilObserver,
  brandStoreRequests,
  storesResponse,
} from "../../../test-utils";
import { brandStoresState } from "../../../state/brandStoreState";

import Members from "../Members";

import type { MutableSnapshot } from "recoil";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    id: "test-store-id",
  }),
}));

function renderComponent() {
  const queryClient = new QueryClient();

  render(
    <RecoilRoot
      initializeState={(snapshot: MutableSnapshot) => {
        return snapshot.set(brandStoresState, storesResponse);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RecoilObserver node={brandStoresState} event={jest.fn()} />
          <Members />
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

describe("Members", () => {
  test("shows correct store name in title", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Test store / Members" }),
      ).toBeInTheDocument();
    });
  });

  test("shows members table", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/2 members/)).toBeInTheDocument();
    });
  });

  test("shows invites table", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/2 invites/)).toBeInTheDocument();
    });
  });

  test("filters members table", async () => {
    renderComponent();

    const user = userEvent.setup();

    await waitFor(() => {
      user.type(screen.getByLabelText("Search and filter"), "joh");
    });

    await waitFor(() => {
      expect(screen.getAllByText("john.doe@canonical.com")).toHaveLength(2);
      expect(screen.getAllByText("jane.doe@canonical.com")).toHaveLength(1);
    });
  });
});
