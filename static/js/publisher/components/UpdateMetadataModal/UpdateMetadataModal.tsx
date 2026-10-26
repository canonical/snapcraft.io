import { useEffect, useRef } from "react";
import { Button, Modal } from "@canonical/react-ds-global";

import type { Dispatch, SetStateAction } from "react";
import type { FieldValues } from "react-hook-form";
import type { UseMutateFunction } from "react-query";
import { MutationResponse } from "../../hooks/useMutateListingData";

type Props = {
  setShowMetadataWarningModal: Dispatch<SetStateAction<boolean>>;
  submitForm: UseMutateFunction<
    MutationResponse,
    unknown,
    FieldValues,
    unknown
  >;
  formData: Record<string, unknown>;
};

function UpdateMetadataModal({
  setShowMetadataWarningModal,
  submitForm,
  formData,
}: Props): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <Modal
      ref={dialogRef}
      onClose={() => {
        setShowMetadataWarningModal(false);
      }}
    >
      <Modal.Header>Warning</Modal.Header>
      <Modal.Content>
        <p>
          Making these changes means that the snap will no longer use the data
          from snapcraft.yaml.
        </p>
      </Modal.Content>
      <Modal.Footer>
        <Button
          type="button"
          className="u-no-margin--bottom"
          importance="secondary"
          onClick={() => {
            setShowMetadataWarningModal(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="u-no-margin--bottom u-no-margin--right"
          importance="primary"
          anticipation="constructive"
          onClick={() => {
            submitForm(formData);
            setShowMetadataWarningModal(false);
          }}
        >
          Save changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UpdateMetadataModal;
