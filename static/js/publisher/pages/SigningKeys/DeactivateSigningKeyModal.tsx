import { Link, useParams } from "react-router-dom";
import { Modal, Button, Icon } from "@canonical/react-components";

import type { SigningKey } from "../../types/shared";
import { Dispatch, SetStateAction } from "react";

type Props = {
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  handleDisable: (signingKey: SigningKey) => void;
  isDeleting: boolean;
  signingKey: SigningKey;
};

function DeactivateSigningKeyModal({
  setModalOpen,
  handleDisable,
  isDeleting,
  signingKey,
}: Props): React.JSX.Element {
  const { id } = useParams();

  return signingKey.models && signingKey.models.length > 0 ? (
    <Modal
      title={
        <>
          <Icon name="warning" />
          {` Deactivate ${signingKey.name}`}
        </>
      }
      close={() => {
        setModalOpen(false);
      }}
    >
      <h3>{signingKey.name} is used in :</h3>
      <ul>
        {signingKey.models &&
          signingKey.models.length > 0 &&
          signingKey.models.map((model) => (
            <li key={model}>
              <Link to={`/admin/${id}/models/${model}/policies`}>{model}</Link>
            </li>
          ))}
      </ul>
      <p>
        You need to update each policy with a new key first to be able to delete
        this one.
      </p>
    </Modal>
  ) : (
    <Modal
      close={() => {
        setModalOpen(false);
      }}
      title="Confirm disable"
      buttonRow={
        <>
          <Button
            dense
            className="u-no-margin--bottom"
            onClick={() => {
              setModalOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button
            dense
            className="p-button--negative u-no-margin--bottom u-no-margin--right"
            onClick={() => {
              handleDisable(signingKey);
            }}
            disabled={isDeleting}
          >
            Disable
          </Button>
        </>
      }
    >
      {isDeleting ? (
        <p>
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;Deleting signing key...
        </p>
      ) : (
        <p>{`Warning: This will permanently disable the signing key ${signingKey.name}.`}</p>
      )}
    </Modal>
  );
}

export default DeactivateSigningKeyModal;
