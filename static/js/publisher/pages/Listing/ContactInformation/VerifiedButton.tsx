import { Button, Icon } from "@canonical/react-components";

import type { Dispatch, SetStateAction } from "react";

type Props = {
  isDirty: boolean;
  setShowVerifyModal: Dispatch<SetStateAction<boolean>>;
};

function VerifiedButton({ isDirty, setShowVerifyModal }: Props): JSX.Element {
  return (
    <Button
      type="button"
      className="p-button--base has-icon"
      onClick={() => {
        setShowVerifyModal(true);
      }}
      disabled={isDirty}
    >
      <Icon name="success" />
      <span>Ownership verified</span>
      <Icon name="chevron-right" />
    </Button>
  );
}

export default VerifiedButton;
