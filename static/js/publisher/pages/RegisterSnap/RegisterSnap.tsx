import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Notification } from "@canonical/react-components";

import RegisterSnapForm from "./RegisterSnapForm";

import { filterAvailableStores } from "../../utils";

import { useBrandStores } from "../../hooks";

import type { RegistrationResponse } from "./local-types";

function RegisterSnap(): ReactNode {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponse>();
  const { data, isLoading } = useBrandStores();

  const availableStores = filterAvailableStores(data || []);

  return (
    <div className="u-fixed-width">
      {registrationResponse?.error_code === "already_registered" ||
      registrationResponse?.error_code === "already_claimed" ? (
        <>
          <h1 className="p-heading--2">
            <strong>{registrationResponse.snap_name}</strong> is already taken
          </h1>

          <Notification severity="caution">
            Another publisher already registered{" "}
            <strong>{registrationResponse.snap_name}</strong>. You can{" "}
            <Link
              to={`/register-name-dispute?snap-name=${registrationResponse.snap_name}&store=${registrationResponse.store}`}
            >
              file a dispute
            </Link>{" "}
            to request a transfer of ownership or register a new name below.
          </Notification>
        </>
      ) : (
        <h1 className="p-heading--2">Register snap</h1>
      )}

      {registrationResponse?.error_code === "name-review-required" && (
        <Notification severity="positive">
          <strong>{registrationResponse?.snap_name}</strong> has been submitted
          for review
        </Notification>
      )}

      {registrationResponse?.error_code === "already_owned" && (
        <Notification severity="caution">
          You already own '
          <Link to={`/${registrationResponse.snap_name}/listing`}>
            <strong>{registrationResponse.snap_name}</strong>
          </Link>
          '.
        </Notification>
      )}

      {registrationResponse?.error_code === "reserved_name" && (
        <Notification severity="caution">
          '<strong>{registrationResponse.snap_name}</strong>' is reserved. You
          can{" "}
          <a
            href={`/request-reserved-name?snap_name=${registrationResponse.snap_name}&store=${registrationResponse.store}&is_private=${registrationResponse.is_private}`}
          >
            request a reserved name
          </a>{" "}
          or register a new name below.
        </Notification>
      )}

      {registrationResponse?.error_code === "no-permission" && (
        <Notification severity="caution">
          You do not have permission to register snaps to this store. Contact
          the store administrator.
        </Notification>
      )}

      {registrationResponse?.error_code !== "already_registered" && (
        <p>
          Before you can push your snap to the store, its name must be
          registered
        </p>
      )}

      <Notification severity="information">
        Snap name registrations are subject to manual review. You will be able
        to upload your snap and update its metadata, but you will not be able to
        make the Snap public until the review has been completed. We aim to
        review all registrations within 30 days
      </Notification>

      {!isLoading && availableStores.length > 0 && (
        <RegisterSnapForm
          isSending={isSending}
          setIsSending={setIsSending}
          setRegistrationResponse={setRegistrationResponse}
          availableStores={availableStores}
        />
      )}
    </div>
  );
}

export default RegisterSnap;
