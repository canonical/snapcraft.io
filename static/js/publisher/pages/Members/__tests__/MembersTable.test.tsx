import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import MembersTable from "../MembersTable";

import type { Member } from "../../../types/shared";

const mockMembers: Member[] = [
  {
    displayname: "John Doe",
    email: "john.doe@canonical.com",
    id: "id-1",
    roles: ["admin"],
    username: "johndoe",
    current_user: true,
  },
  {
    displayname: "Jane Doe",
    email: "jane.doe@canonical.com",
    id: "id-2",
    roles: ["admin"],
    username: "janedoe",
    current_user: false,
  },
];

function renderComponent(members?: Member[]) {
  render(
    <MembersTable
      filteredMembers={members || mockMembers}
      changedMembers={members || mockMembers}
      setChangedMembers={jest.fn()}
    />,
  );
}

describe("MembersTable", () => {
  test("renders table columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: "Users" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Email" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: /Admin/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: /Reviewer/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: /Viewer/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: /Publisher/ }),
    ).toBeInTheDocument();
  });

  test("displays members in table", () => {
    renderComponent();
    expect(screen.getByText(mockMembers[0].displayname)).toBeInTheDocument();
    expect(screen.getByText(mockMembers[0].email)).toBeInTheDocument();
    expect(screen.getByText(mockMembers[1].displayname)).toBeInTheDocument();
    expect(screen.getByText(mockMembers[1].email)).toBeInTheDocument();
  });

  test("checks the roles", () => {
    renderComponent([mockMembers[0]]);
    expect(screen.getByLabelText("Admin")).toBeChecked();
    expect(screen.getByLabelText("Reviewer")).not.toBeChecked();
    expect(screen.getByLabelText("Viewer")).not.toBeChecked();
    expect(screen.getByLabelText("Publisher")).not.toBeChecked();
  });
});
