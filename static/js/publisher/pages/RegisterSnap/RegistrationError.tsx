import { Link } from "react-router-dom";
import { Notification } from "@canonical/react-components";

type Props = {
  errorCode: string;
  snapName: string;
  isPrivate: string;
  store: string;
};

function RegistrationError({ snapName, errorCode, isPrivate, store }: Props) {
  if (errorCode === "name-review-required") {
    return (
      <Notification severity="caution">
        All snap names are currently subject to a review. Please see{" "}
        <a href="https://forum.snapcraft.io/t/manual-review-of-all-new-snap-name-registrations/39440">
          https://forum.snapcraft.io/t/manual-review-of-all-new-snap-name-registrations/39440
        </a>{" "}
        for details. Follow this link to submit a name request for your snap:
        <a href="https://dashboard.snapcraft.io/register-snap">
          https://dashboard.snapcraft.io/register-snap
        </a>
      </Notification>
    );
  }

  if (errorCode === "already_owned") {
    return (
      <Notification severity="information">
        You already own '
        <Link to={`/${snapName}/listing`}>
          <strong>{snapName}</strong>
        </Link>
        '.
      </Notification>
    );
  }

  if (errorCode === "reserved_name") {
    return (
      <Notification severity="information">
        '<strong>{snapName}</strong>' is reserved. You can{" "}
        <a
          href={`/request-reserved-name?snap_name=${snapName}&store=${store}&is_isPrivate=${isPrivate}`}
        >
          request a reserved name
        </a>{" "}
        or register a new name below.
      </Notification>
    );
  }

  if (errorCode === "no-permission") {
    return (
      <Notification severity="information">
        You do not have permission to register snaps to this store. Contact the
        store administrator.
      </Notification>
    );
  }

  if (errorCode !== "already_registered") {
    return (
      <Notification severity="information">
        Before you can push your snap to the store, its name must be registered
      </Notification>
    );
  }

  return null;
}

export default RegistrationError;
