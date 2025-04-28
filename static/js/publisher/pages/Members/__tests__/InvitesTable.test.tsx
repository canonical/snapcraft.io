import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

import InvitesTable from "../InvitesTable";

import { Invite } from "../../../types/shared";

const mockInvites: Invite[] = [
  {
    status: "Expired",
    email: "john.doe@canonical.com",
    roles: ["admin"],
    "expiration-date": "2025-02-15T14:52:17Z",
  },
];

function renderComponent() {
  render(
    <InvitesTable
      invites={mockInvites}
      refetchInvites={jest.fn()}
      setShowErrorNotification={jest.fn()}
      setShowSuccessNotification={jest.fn()}
      setNotificationText={jest.fn()}
    />,
  );
}

describe("InvitesTable", () => {
  test("renders table columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: "Status" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Email" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Expires" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Roles" }),
    ).toBeInTheDocument();
  });

  test("displays members in table", () => {
    renderComponent();
    expect(screen.getByText("john.doe@canonical.com")).toBeInTheDocument();
  });

  test("opens action modal", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Reopen" }));
    expect(
      screen.getByRole("heading", { name: "Reopen invite" }),
    ).toBeInTheDocument();
  });
});
