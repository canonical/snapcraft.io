import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import { ISnap } from "../../../types";
import RegisteredSnaps from "../RegisteredSnaps";
import "@testing-library/jest-dom";

const BASE_SNAP_DATA = {
  snapName: "test-snap-1",
  icon_url: null,
  latest_comments: [],
  latest_release: {
    architectures: ["arm64"],
    channels: ["edge"],
    revision: 3,
    since: "2024-10-09T09:33:14Z",
    status: "Published",
    version: "4.0.1",
  },
  latest_revisions: [
    {
      architectures: ["arm64"],
      channels: ["edge"],
      revision: 3,
      since: "2024-10-09T09:33:14Z",
      status: "Published",
      version: "4.0.1",
    },
  ],
  price: null,
  private: true,
  publisher: {
    "display-name": "Test User 2",
    id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
    username: "test-user-2",
    validation: null,
  },
  since: "2021-01-07T14:48:48Z",
  "snap-id": "2WF9gVKsi8iDCB4WFF5uO8JyBOImG2fb",
  status: "Approved",
  store: "Global",
  unlisted: false,
};

const queryClient = new QueryClient();

const renderComponent = (snaps: ISnap[]) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RegisteredSnaps
          currentUser="test-user"
          snaps={snaps}
          refetchSnaps={jest.fn()}
        />
        ,
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

const generateSnaps = () => {
  const snaps: ISnap[] = [];
  for (let i = 0; i < 15; i++) {
    const snap = {
      ...BASE_SNAP_DATA,
      snapName: `Test Snap ${i}`,
    };

    snaps.push(snap);
  }
  return snaps;
};

describe("RegisteredSnaps", () => {
  test("should show correct number of snaps in a page", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);
    expect(screen.getAllByRole("row").length).toBe(10);
  });

  test("should paginate correctly", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);

    const paginationButtons = screen.getAllByRole("button");
    fireEvent.click(paginationButtons[paginationButtons.length - 1]);
    expect(screen.getAllByRole("row").length).toBe(5);
  });

  test("should show dispute pending label", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        status: "DisputePending",
      },
    ]);
    expect(screen.getByLabelText("Name dispute in progress")).not.toBeNull();
    expect(screen.getByText("(Name dispute in progress)")).not.toBeNull();
  });

  test("should show the snap name correctly", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        snapName: "test-snap",
      },
    ]);
    expect(screen.queryByLabelText("Name dispute in progress")).toBeNull();
    expect(screen.getByText("test-snap")).not.toBeNull();
  });

  test("should render the unregister button disabled if the snap doesn't belong to the current user", () => {
    renderComponent([BASE_SNAP_DATA]);

    expect(screen.getByRole("button", { name: "Unregister" })).toBeDisabled();
  });

  test("should call the refresh function when a snap name is unregistered", () => {
    renderComponent([
      {
        ...BASE_SNAP_DATA,
        publisher: {
          ...BASE_SNAP_DATA.publisher,
          username: "test-user",
        },
      },
    ]);

    const unregisterButton = screen.getByRole("button", { name: "Unregister" });
    expect(unregisterButton).not.toBeDisabled();
  });
});
