import { Notification } from "@canonical/react-components";

import type { SetStateBoolean } from "../../types";
import { Dispatch, SetStateAction } from "react";

type Props = {
  hasSaved: boolean;
  setHasSaved: SetStateBoolean;
  savedError: boolean | Array<{ message: string }>;
  setSavedError: Dispatch<
    SetStateAction<boolean | { code: string; message: string }[]>
  >;
};

function SaveStateNotifications({
  hasSaved,
  setHasSaved,
  savedError,
  setSavedError,
}: Props) {
  return (
    <>
      {hasSaved && (
        <div className="u-fixed-width">
          <Notification
            severity="positive"
            title="Changes applied successfully."
            onDismiss={() => {
              setHasSaved(false);
            }}
          />
        </div>
      )}

      {savedError && (
        <div className="u-fixed-width">
          <Notification
            severity="negative"
            title="Error"
            onDismiss={() => {
              setHasSaved(false);
              setSavedError(false);
            }}
          >
            Changes have not been saved.
            <br />
            {savedError === true
              ? "Something went wrong."
              : savedError.map((error) => `${error.message}`).join("\n")}
          </Notification>
        </div>
      )}
    </>
  );
}

export default SaveStateNotifications;
