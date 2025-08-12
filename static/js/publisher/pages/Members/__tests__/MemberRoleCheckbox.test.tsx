import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import MemberRoleCheckbox from "../MemberRoleCheckbox";

import type { Member } from "../../../types/shared";

const mockMember: Member = {
  displayname: "John Doe",
  email: "john.doe@canonical.com",
  id: "id-1",
  roles: ["admin", "view"],
  username: "johndoe",
  current_user: false,
};

const mockHandleRoleChange = jest.fn();

function renderComponent(
  member = mockMember,
  memberRole: "admin" | "review" | "view" | "access" = "admin",
  handleRoleChange = mockHandleRoleChange,
) {
  return render(
    <MemberRoleCheckbox
      member={member}
      memberRole={memberRole}
      handleRoleChange={handleRoleChange}
    />,
  );
}

describe("MemberRoleCheckbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders checkbox with correct label", () => {
    renderComponent();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("shows checkbox as checked when member has the role", () => {
    renderComponent(mockMember, "admin");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  test("shows checkbox as unchecked when member does not have the role", () => {
    renderComponent(mockMember, "review");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  test("calls handleRoleChange when checkbox is clicked", () => {
    renderComponent(mockMember, "admin");

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockHandleRoleChange).toHaveBeenCalledTimes(1);
    expect(mockHandleRoleChange).toHaveBeenCalledWith(mockMember, "admin");
  });

  test("handles different role types correctly", () => {
    const { rerender } = renderComponent(mockMember, "review");
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();

    rerender(
      <MemberRoleCheckbox
        member={mockMember}
        memberRole="view"
        handleRoleChange={mockHandleRoleChange}
      />,
    );
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();

    rerender(
      <MemberRoleCheckbox
        member={mockMember}
        memberRole="access"
        handleRoleChange={mockHandleRoleChange}
      />,
    );
    expect(screen.getByText("Publisher")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  test("works with member having no roles", () => {
    const memberWithoutRoles: Member = {
      ...mockMember,
      roles: [],
    };

    renderComponent(memberWithoutRoles, "admin");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockHandleRoleChange).toHaveBeenCalledWith(
      memberWithoutRoles,
      "admin",
    );
  });

  test("works with member having multiple roles", () => {
    const memberWithMultipleRoles: Member = {
      ...mockMember,
      roles: ["admin", "review", "view", "access"],
    };

    renderComponent(memberWithMultipleRoles, "review");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(mockHandleRoleChange).toHaveBeenCalledWith(
      memberWithMultipleRoles,
      "review",
    );
  });
});
