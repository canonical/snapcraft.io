import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { Button } from "@canonical/react-components";

import { buildRepoConnectedState } from "../../state/atoms";

import type { GithubData, SetStateBoolean } from "../../types";

type Props = {
  setDisconnectModalOpen: SetStateBoolean;
  githubData: GithubData | null;
};

function DisconnectRepoActions({
  setDisconnectModalOpen,
  githubData,
}: Props): JSX.Element {
  const { snapId } = useParams();
  const setRepoConnected = useSetRecoilState(buildRepoConnectedState);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);

  const handleRepoDisconnect = async () => {
    setDisconnecting(true);
    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);
    const response = await fetch(`/api/${snapId}/builds/disconnect`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      if (githubData !== null) {
        setRepoConnected(false);
      }
    }

    setRepoConnected(false);
    setDisconnectModalOpen(false);
    setDisconnecting(false);
  };

  return (
    <>
      <Button
        className="u-no-margin--bottom"
        onClick={() => {
          setDisconnectModalOpen(false);
        }}
      >
        Cancel
      </Button>
      <Button
        appearance="positive"
        className="u-no-margin--bottom u-no-margin--right"
        disabled={disconnecting}
        onClick={handleRepoDisconnect}
      >
        Confirm
      </Button>
    </>
  );
}

export default DisconnectRepoActions;
