import {
  Button,
  // Need to use the `Icon` from `react-components` because
  // the spacing is dependent on the Pragma button
  Icon as ReactComponentsIcon,
} from "@canonical/react-components";

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
      <ReactComponentsIcon name="success" />
      <span>Ownership verified</span>
      <ReactComponentsIcon name="chevron-right" />
    </Button>
  );
}

export default VerifiedButton;
