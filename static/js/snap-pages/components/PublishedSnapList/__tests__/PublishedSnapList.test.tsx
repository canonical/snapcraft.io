import { render, screen } from "@testing-library/react";

import PublishedSnapList from "../PublishedSnapList";
import { ISnap } from "../../../types";

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

const renderComponent = (snaps: ISnap[]) => {
  return render(
    <PublishedSnapList
      currentPage={1}
      currentUser="test-user-1"
      setCurrentPage={() => {}}
      snaps={snaps}
      totalItems={snaps.length}
    />,
  );
};

describe("PublishedSnapList", () => {
  test("should display the published snap", () => {
    renderComponent([BASE_SNAP_DATA]);

    expect(screen.getByText(/test-snap-1/)).not.toBeNull();
    expect(screen.getByText(/4.0.1/)).not.toBeNull();
    expect(screen.getByText(/edge/)).not.toBeNull();
    expect(screen.getByText(/Private/)).not.toBeNull();
    expect(screen.getByText(/Test User 2/)).not.toBeNull();
  });

  test("should display the published snap with empty latest release", () => {
    const snap = {
      ...BASE_SNAP_DATA,
      latest_release: null,
      latest_revisions: [],
    };
    renderComponent([snap]);

    expect(screen.getByText(/Not released/)).not.toBeNull();
  });

  test("should display the correct publisher if the published snap is owned by the user", () => {
    const snap = {
      ...BASE_SNAP_DATA,
      publisher: {
        "display-name": "Test User 1",
        id: "prFvYmvaBsQbXLNaVaQFV4EAcJ8zh0Ej",
        username: "test-user-1",
        validation: null,
      },
    };
    renderComponent([snap]);

    expect(screen.getByText("You")).not.toBeNull();
  });

  test("should display the new snap notification if the snap is released recently", () => {
    const snap = {
      ...BASE_SNAP_DATA,
      is_new: true,
    };

    renderComponent([snap]);
    expect(
      screen.getByText(`You've released test-snap-1 to the "edge" channel!`),
    ).not.toBeNull();
  });

  test("should display the new snap notification if the snap is added recently", () => {
    const snap = {
      ...BASE_SNAP_DATA,
      latest_release: null,
      latest_revisions: [],
      is_new: true,
    };

    renderComponent([snap]);
    expect(screen.getByText("You've uploaded test-snap-1!")).not.toBeNull();
  });
});
