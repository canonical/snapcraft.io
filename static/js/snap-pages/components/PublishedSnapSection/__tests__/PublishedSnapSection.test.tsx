import { fireEvent, render, screen } from "@testing-library/react";

import { ISnap } from "../../../types";
import PublishedSnapSection from "../PublishedSnapSection";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";

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
    <QueryClientProvider client={queryClient}>
      <PublishedSnapSection currentUser="test-user" snaps={snaps} />
    </QueryClientProvider>,
  );
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

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

describe("PublishedSnapSection", () => {
  beforeAll(() => {
    // @ts-expect-error Mocking useQuery with status loading
    useQuery.mockReturnValue({ status: "loading", data: undefined });
  });

  test("should show correct number of snaps in a page", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);
    expect(screen.getAllByRole("row").length).toBe(11);
  });

  test("should paginate correctly", () => {
    const snaps: ISnap[] = generateSnaps();

    renderComponent(snaps);

    const paginationButtons = screen.getAllByRole("button");
    fireEvent.click(paginationButtons[paginationButtons.length - 1]);
    expect(screen.getAllByRole("row").length).toBe(6);
  });
});
