import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button, Modal } from "@canonical/react-ds-global";

type UnregisterSnapModalProps = {
  snapName: string;
  setUnregisterModalOpen: Dispatch<SetStateAction<boolean>>;
  setUnregisterError: Dispatch<SetStateAction<boolean>>;
  setUnregisterErrorMessage: Dispatch<SetStateAction<string>>;
};

export function UnregisterSnapModal({
  snapName,
  setUnregisterModalOpen,
  setUnregisterError,
  setUnregisterErrorMessage,
}: UnregisterSnapModalProps) {
  const [unregisterPackageInProgress, setUnregisterPackageInProgress] =
    useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const unregisterPackage = async () => {
    try {
      const response = await fetch(`/packages/${snapName}`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": window["CSRF_TOKEN"],
        },
      });

      if (response.status === 202) {
        const responseData = await response.json();
        if (responseData.authorization_required && responseData.redirect_url) {
          window.location.href = responseData.redirect_url;
        } else {
          setUnregisterModalOpen(false);
          setUnregisterError(true);
          setUnregisterErrorMessage(
            "Something went wrong. Please try again later.",
          );
        }
      } else if (!response.ok) {
        const responseData = await response.json();
        setUnregisterModalOpen(false);
        setUnregisterError(true);
        setUnregisterErrorMessage(responseData.error);
      } else {
        window.location.href = "/snaps";
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      ref={dialogRef}
      onClose={() => {
        setUnregisterModalOpen(false);
      }}
    >
      <Modal.Header>
        <span className="u-has-icon">
          <i className="p-icon--warning modal-header-icon"></i>
          Unregister "{snapName}"
        </span>
      </Modal.Header>
      <Modal.Content>
        <p>
          Are you sure you want to unregister "{snapName}"?
          <br />
          This name will be removed from your registered names and become
          available to others. This action is permanent and cannot be undone.
        </p>
      </Modal.Content>
      <Modal.Footer>
        <Button
          importance="secondary"
          onClick={() => {
            setUnregisterModalOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          importance="primary"
          anticipation="destructive"
          loading={unregisterPackageInProgress}
          onClick={() => {
            setUnregisterPackageInProgress(true);
            unregisterPackage();
          }}
        >
          {unregisterPackageInProgress ? "Unregistering..." : "Unregister"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
