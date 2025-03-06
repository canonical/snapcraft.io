import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  Notification,
  Form,
  Button,
  Select,
  Row,
  Col,
  Input,
} from "@canonical/react-components";

import { useAvailableStores } from "../../hooks";

function RegisterSnap(): ReactNode {
  const { data, isLoading } = useAvailableStores();
  const [snapName, setSnapName] = useState<string>();
  const [selectedStore, setSelectedStore] = useState<string>("ubuntu");
  const [isPrivate, setIsPrivate] = useState<string>("private");
  const [registrationError, setRegistrationError] = useState<string>();
  const [requestedSnapName, setRequestedSnapName] = useState<string>();

  return (
    <>
      <h1 className="p-heading--2">
        {registrationError === "already_registered" ? (
          <>
            <strong>{requestedSnapName}</strong> is already taken
          </>
        ) : (
          <>Register snap</>
        )}
      </h1>

      {registrationError === "already_registered" && (
        <Notification severity="caution">
          Another publisher has already registered{" "}
          <strong>{requestedSnapName}</strong>. You can{" "}
          <Link
            to={`/register-name-dispute?snap_name=${encodeURIComponent(requestedSnapName || "")}&store=${encodeURIComponent(selectedStore)}`}
          >
            file a dispute
          </Link>{" "}
          to request a transfer of ownership or register a new name below.
        </Notification>
      )}

      {registrationError === "already_owned" && (
        <Notification severity="caution">
          You already own '
          <Link to={`/${encodeURIComponent(requestedSnapName || "")}/listing`}>
            <strong>{requestedSnapName}</strong>
          </Link>
          '
        </Notification>
      )}

      {registrationError === "reserved_name" && (
        <Notification severity="caution">
          '<strong>{requestedSnapName}</strong>' is reserved. You can{" "}
          <Link
            to={`/request-reserved-name?${encodeURIComponent(requestedSnapName || "")}&store=${encodeURIComponent(selectedStore)}&is_private=${encodeURIComponent(isPrivate)}`}
          >
            request a reserved name
          </Link>{" "}
          or register a new name below.
        </Notification>
      )}

      {registrationError !== "already_registered" && (
        <p>
          Before you can push your snap to the store, its name must be
          registered
        </p>
      )}

      {selectedStore === "ubuntu" && (
        <Notification severity="information">
          Snap name registrations are subject to manual review. You will be able
          to upload your snap and update its metadata, but you will not be able
          to make the Snap public until the review has been completed. We aim to
          review all registrations within 30 days
        </Notification>
      )}

      <Form
        stacked
        onSubmit={async (e) => {
          e.preventDefault();

          const response = await fetch("/api/register-snap", {
            method: "POST",
            headers: {
              "X-CSRF-Token": window.CSRF_TOKEN,
            },
            body: JSON.stringify({
              snap_name: snapName,
              store: selectedStore,
              is_private: isPrivate,
            }),
          });

          if (!response.ok) {
            throw new Error("Unable to register snap");
          }

          const responseData = await response.json();

          if (!responseData.success) {
            setRegistrationError(responseData.data.error_code);
            setRequestedSnapName(responseData.data.snap_name);
          } else {
            setRegistrationError("");
            setRequestedSnapName("");
          }
        }}
      >
        <Row>
          <Col size={8}>
            {!isLoading && data && data.length > 0 && (
              <Select
                stacked
                label="Store"
                options={data.map((store: { name: string; id: string }) => {
                  return {
                    label: store.name,
                    value: store.id,
                  };
                })}
                onChange={(e) => {
                  setSelectedStore(e.target.value);
                  setIsPrivate("private");
                }}
              />
            )}

            <Input
              stacked
              type="text"
              label="Snap name"
              defaultValue={snapName}
              onChange={(e) => {
                setSnapName(e.target.value);
              }}
            />

            <label htmlFor="snap-privacy">Snap privacy</label>
            <p className="p-form-help-text">
              This can be changed at any time after the initial upload
            </p>

            <Input
              type="radio"
              name="snap-privacy"
              label="Public"
              value="public"
              checked={isPrivate === "public"}
              onChange={(e) => {
                setIsPrivate(e.target.value);
              }}
              disabled={selectedStore === "ubuntu"}
            />
            <Input
              type="radio"
              name="snap-privacy"
              label="Private"
              value="private"
              checked={isPrivate === "private"}
              onChange={(e) => {
                setIsPrivate(e.target.value);
              }}
              disabled={selectedStore === "ubuntu"}
              help="Snap is hidden in stores and only accessible by the publisher and collaborators"
            />
          </Col>
        </Row>
        <hr />
        <div className="u-align--right">
          <Button type="submit" appearance="positive" disabled={!snapName}>
            Register
          </Button>
          <Link className="p-button" to="/snaps">
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}

export default RegisterSnap;
