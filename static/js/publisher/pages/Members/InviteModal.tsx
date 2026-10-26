import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Button, Modal } from "@canonical/react-ds-global";
import type { InviteActionData } from "../../types/shared";

type Props = {
  inviteActionData: InviteActionData | null;
  inviteModalOpen: boolean;
  setInviteModalOpen: Dispatch<SetStateAction<boolean>>;
  updateInvite: (data: InviteActionData) => void;
  inviteModalIsSaving: boolean;
};

function InviteModal({
  inviteActionData,
  inviteModalOpen,
  setInviteModalOpen,
  updateInvite,
  inviteModalIsSaving,
}: Props): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (inviteModalOpen && inviteActionData) {
      dialogRef.current?.showModal();
    }
  }, [inviteModalOpen, inviteActionData]);

  if (!inviteModalOpen || !inviteActionData) {
    return null;
  }

  const ACTIONS = {
    resend: "Resend",
    revoke: "Revoke",
    open: "Reopen",
  };

  const closeHandler = () => setInviteModalOpen(false);

  return (
    <Modal ref={dialogRef} onClose={closeHandler}>
      <Modal.Header>{`${ACTIONS[inviteActionData.action]} invite`}</Modal.Header>
      <Modal.Content>
        {inviteActionData.action === "resend" && (
          <p>
            Resending your invite will send a reminder email to{" "}
            <strong>{inviteActionData.email}</strong>. Do you still want to do
            it?
          </p>
        )}

        {inviteActionData.action === "revoke" && (
          <p>
            Revoking your invite will prevent{" "}
            <strong>{inviteActionData.email}</strong> from accepting your
            invite. Do you still want to do it?
          </p>
        )}

        {inviteActionData.action === "open" && (
          <p>
            Reopening your invite will send a new invite to{" "}
            <strong>{inviteActionData.email}</strong>. Do you still want to do
            it?
          </p>
        )}
      </Modal.Content>
      <Modal.Footer>
        <Button importance="secondary" onClick={closeHandler}>
          Cancel
        </Button>

        <Button
          importance="primary"
          anticipation="constructive"
          loading={inviteModalIsSaving}
          onClick={() => {
            updateInvite(inviteActionData);
          }}
        >
          {`${ACTIONS[inviteActionData.action]} invite`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default InviteModal;
