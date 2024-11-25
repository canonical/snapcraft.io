import { Dispatch, SetStateAction } from "react";
import { Modal, Button } from "@canonical/react-components";
import { FieldValues, SubmitHandler } from "react-hook-form";

type Props = {
  setShowMetadataWarningModal: Dispatch<SetStateAction<boolean>>;
  submitForm: SubmitHandler<FieldValues>;
  formData: FieldValues | null;
};

function UpdateMetadataModal({
  setShowMetadataWarningModal,
  submitForm,
  formData,
}: Props) {
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
              if (formData !== null) {
                submitForm(formData);
              }
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
