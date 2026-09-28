import { Dispatch, SetStateAction, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetAtom } from "jotai";
import { Button } from "@canonical/react-ds-global";

import { buildRepoConnectedState } from "../../state/buildsState";

import type { GithubData } from "../../types";

type Props = {
  setDisconnectModalOpen: Dispatch<SetStateAction<boolean>>;
  githubData: GithubData | null;
};

function DisconnectRepoActions({
  setDisconnectModalOpen,
  githubData,
}: Props): React.JSX.Element {
  const { snapId } = useParams();
  const setRepoConnected = useSetAtom(buildRepoConnectedState);
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
        importance="secondary"
        className="u-no-margin--bottom"
        onClick={() => {
          setDisconnectModalOpen(false);
        }}
      >
        Cancel
      </Button>
      {disconnecting ? (
        <Button
          importance="primary"
          anticipation="destructive"
          className="u-no-margin--bottom u-no-margin--right"
          loading
          // Needed to prevent jump as this
          // button is wider than the original
          // button by default
          style={{ width: "100px" }}
        >
          Disconnecting
        </Button>
      ) : (
        <Button
          importance="primary"
          anticipation="destructive"
          className="u-no-margin--bottom u-no-margin--right"
          onClick={handleRepoDisconnect}
          // Needed to ensure its the same
          // as the loading button
          style={{ width: "100px" }}
        >
          Confirm
        </Button>
      )}
    </>
  );
}

export default DisconnectRepoActions;
