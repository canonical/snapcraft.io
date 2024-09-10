import { Notification } from "@canonical/react-components";

type Props = {
  hasSaved: boolean;
  setHasSaved: Function;
  savedError: boolean | Array<{ message: string }>;
  setSavedError: Function;
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
