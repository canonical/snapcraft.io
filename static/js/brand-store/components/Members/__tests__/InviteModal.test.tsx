import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import InviteModal from "../InviteModal";

const updateInvite = jest.fn();

const renderComponent = (props: {
  inviteActionData: { action: "resend" | "revoke" | "open"; email: string };
  inviteModalIsSaving: boolean;
}) => {
  render(
    <InviteModal
      inviteActionData={props.inviteActionData}
      inviteModalOpen={true}
      setInviteModalOpen={jest.fn()}
      updateInvite={updateInvite}
      inviteModalIsSaving={props.inviteModalIsSaving}
    />
  );
};

describe("InviteModal", () => {
  test("calls updateInvite function with resend when saving", async () => {
    const user = userEvent.setup();
    renderComponent({
      inviteActionData: { action: "resend", email: "john@testing.com" },
      inviteModalIsSaving: false,
    });
    await user.click(screen.getByRole("button", { name: "Resend invite" }));
    expect(updateInvite).toHaveBeenCalledWith({
      action: "resend",
      email: "john@testing.com",
    });
  });

  test("calls updateInvite function with revoke when saving", async () => {
    const user = userEvent.setup();
    renderComponent({
      inviteActionData: { action: "revoke", email: "john@testing.com" },
      inviteModalIsSaving: false,
    });
    await user.click(screen.getByRole("button", { name: "Revoke invite" }));
    expect(updateInvite).toHaveBeenCalledWith({
      action: "revoke",
      email: "john@testing.com",
    });
  });

  test("calls updateInvite function with reopen when saving", async () => {
    const user = userEvent.setup();
    renderComponent({
      inviteActionData: { action: "open", email: "john@testing.com" },
      inviteModalIsSaving: false,
    });
    await user.click(screen.getByRole("button", { name: "Reopen invite" }));
    expect(updateInvite).toHaveBeenCalledWith({
      action: "open",
      email: "john@testing.com",
    });
  });
});
