import { Modal, Button } from "@canonical/react-components";

import type { Dispatch, SetStateAction } from "react";
import type { FieldValues } from "react-hook-form";
import type { UseMutateFunction } from "react-query";

type Props = {
  setShowMetadataWarningModal: Dispatch<SetStateAction<boolean>>;
  submitForm: UseMutateFunction<void, unknown, FieldValues, unknown>;
  formData: Record<string, unknown>;
};

function UpdateMetadataModal({
  setShowMetadataWarningModal,
  submitForm,
  formData,
}: Props): React.JSX.Element {
  return (
    <Modal
      close={() => {
        setShowMetadataWarningModal(false);
      }}
      title="Warning"
      buttonRow={
        <>
          <Button
            type="button"
            className="u-no-margin--bottom"
            onClick={() => {
              setShowMetadataWarningModal(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="u-no-margin--bottom u-no-margin--right"
            appearance="positive"
            onClick={() => {
              submitForm(formData);
              setShowMetadataWarningModal(false);
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <p>
        Making these changes means that the snap will no longer use the data
        from snapcraft.yaml.
      </p>
    </Modal>
  );
}

export default UpdateMetadataModal;
