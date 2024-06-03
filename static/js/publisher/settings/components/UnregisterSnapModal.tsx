import React, { useState } from "react";
import {
  Button,
  Modal,
} from "@canonical/react-components";

type UnregisterSnapModalProps = {
    snapName: string;
    setUnregisterModalOpen: Function;
    setUnregisterError: Function;
    setUnregisterErrorMessage: Function;
};

export function UnregisterSnapModal({ snapName, setUnregisterModalOpen, setUnregisterError, setUnregisterErrorMessage }: UnregisterSnapModalProps) {
    const [unregisterPackageInProgress, setUnregisterPackageInProgress] = useState(false);

    const unregisterPackage = async () => {
        try {
            const response = await fetch(`/packages/${snapName}`, {
                method: "DELETE",
                headers: {
                "X-CSRFToken": window["CSRF_TOKEN"],
                },
            });

            if (!response.ok) {
                const responseData = await response.json();
                setUnregisterModalOpen(false);
                setUnregisterError(true);
                setUnregisterErrorMessage(responseData.error);
            } else {
                window.location.href = '/snaps';
            }

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
          <Modal
                close={() => {
                  setUnregisterModalOpen(false);
                }}
                title={
                  <span className="u-has-icon">
                    <i className="p-icon--warning modal-header-icon"></i>
                    Unregister "{snapName}"
                  </span>
                }
                buttonRow={
                  <>
                    <Button
                      className="u-no-margin--bottom"
                      onClick={() => {
                          setUnregisterModalOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      appearance="negative"
                      className={`u-no-margin--bottom ${
                        unregisterPackageInProgress ? "has-icon is-dark" : ""
                      }`}
                      onClick={() => {
                        setUnregisterPackageInProgress(true);
                        unregisterPackage();
                      }}
                      disabled={unregisterPackageInProgress}
                    >
                      {unregisterPackageInProgress ? (
                        <>
                          <i className="p-icon--spinner u-animation--spin is-light"></i>
                          <span>Unregistering...</span>
                        </>
                      ) : (
                        "Unregister"
                      )}
                    </Button>
                  </>
                }
              >
              <p>Are you sure you want to unregister "{snapName}"?<br />
                This name will be removed from your registered names and become available to others. This action is permanent and cannot be undone.
              </p>
          </Modal>
        </>
    );
}
