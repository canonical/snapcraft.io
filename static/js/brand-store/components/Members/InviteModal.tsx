import { Dispatch, ReactNode, SetStateAction } from "react";
import { Modal, Button } from "@canonical/react-components";

type InviteActionData = {
  action: "resend" | "revoke" | "open";
  email: string;
};

type Props = {
  inviteActionData: InviteActionData;
  inviteModalOpen: boolean;
  setInviteModalOpen: Dispatch<SetStateAction<boolean>>;
  updateInvite: Function;
  inviteModalIsSaving: boolean;
};

function InviteModal({
  inviteActionData,
  inviteModalOpen,
  setInviteModalOpen,
  updateInvite,
  inviteModalIsSaving,
}: Props): ReactNode {
  const ACTIONS = {
    resend: "Resend",
    revoke: "Revoke",
    open: "Reopen",
  };

  const closeHandler = () => setInviteModalOpen(false);

  if (!inviteModalOpen) {
    return null;
  }

  return (
    <Modal
      title={`${ACTIONS[inviteActionData.action]} invite`}
      close={closeHandler}
      buttonRow={
        <>
          <Button className="u-no-margin--bottom" onClick={closeHandler}>
            Cancel
          </Button>

          <Button
            appearance="positive"
            className={`u-no-margin--bottom ${
              inviteModalIsSaving ? "has-icon is-dark" : ""
            }`}
            onClick={() => {
              updateInvite(inviteActionData);
            }}
            disabled={inviteModalIsSaving}
          >
            {inviteModalIsSaving ? (
              <>
                <i className="p-icon--spinner u-animation--spin is-light"></i>
                <span>Saving...</span>
              </>
            ) : (
              `${ACTIONS[inviteActionData.action]} invite`
            )}
          </Button>
        </>
      }
    >
      {inviteActionData.action === "resend" && (
        <p>
          Resending your invite will send a reminder email to{" "}
          <strong>{inviteActionData.email}</strong>. Do you still want to do it?
        </p>
      )}

      {inviteActionData.action === "revoke" && (
        <p>
          Revoking your invite will prevent{" "}
          <strong>{inviteActionData.email}</strong> from accepting your invite.
          Do you still want to do it?
        </p>
      )}

      {inviteActionData.action === "open" && (
        <p>
          Reopening your invite will send a new invite to{" "}
          <strong>{inviteActionData.email}</strong>. Do you still want to do it?
        </p>
      )}
    </Modal>
  );
}

export default InviteModal;
