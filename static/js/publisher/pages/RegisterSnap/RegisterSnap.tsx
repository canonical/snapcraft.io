import { useState } from "react";
import { Link } from "react-router-dom";
import { Notification } from "@canonical/react-components";

import RegistrationError from "./RegistrationError";
import RegisterSnapForm from "./RegisterSnapForm";

import { filterAvailableStores } from "../../utils";

import { useBrandStores } from "../../hooks";

import type { RegistrationResponse } from "./local-types";

function RegisterSnap(): React.JSX.Element {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponse>();
  const { data, isLoading } = useBrandStores();

  const availableStores = filterAvailableStores(data || []);
  const [selectedStore, setSelectedStore] = useState<string>("ubuntu");

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

      {registrationResponse?.error_code && (
        <RegistrationError
          snapName={registrationResponse.snap_name}
          isPrivate={registrationResponse.is_private}
          store={registrationResponse.store}
          errorCode={registrationResponse.error_code}
        />
      )}

      {selectedStore === "ubuntu" && (
        <Notification severity="information">
          Snap name registrations are subject to manual review. You will be able
          to upload your snap and update its metadata, but you will not be able
          to make the Snap public until the review has been completed. We aim to
          review all registrations within 30 days
        </Notification>
      )}

      {!isLoading && availableStores.length > 0 && (
        <RegisterSnapForm
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
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
