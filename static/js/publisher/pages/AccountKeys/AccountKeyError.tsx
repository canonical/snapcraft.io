import { Notification } from "@canonical/react-components";

function AccountKeysError(): React.JSX.Element {
  return (
    <div className="u-fixed-width">
      <Notification severity="negative" title="Can't fetch account keys">
        Something went wrong. Please try again later.
      </Notification>
    </div>
  );
}

export default AccountKeysError;
