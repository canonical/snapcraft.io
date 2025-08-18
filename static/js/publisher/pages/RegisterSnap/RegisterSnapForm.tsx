import { useState, Dispatch, SetStateAction, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Form,
  Select,
  Input,
  Button,
  Icon,
  Row,
  Col,
} from "@canonical/react-components";

import type { RegistrationResponse } from "./local-types";

type Props = {
  isSending: boolean;
  setIsSending: Dispatch<SetStateAction<boolean>>;
  setRegistrationResponse: Dispatch<
    SetStateAction<RegistrationResponse | undefined>
  >;
  availableStores: { name: string; id: string }[];
  selectedStore: string;
  setSelectedStore: Dispatch<SetStateAction<string>>;
};

function RegisterSnapForm({
  isSending,
  setIsSending,
  setRegistrationResponse,
  availableStores,
  selectedStore,
  setSelectedStore,
}: Props): React.JSX.Element {
  const [snapName, setSnapName] = useState<string>();
  const [privacy, setPrivacy] = useState<string>("private");
  const [showSnapNameConstraints, setShowSnapNameConstraints] =
    useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsSending(true);

    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);
    formData.set("snap_name", snapName || "");
    formData.set("store", selectedStore);

    const response = await fetch("/api/register-snap", {
      method: "POST",
      headers: {
        "X-CSRFToken": window.CSRF_TOKEN,
      },
      body: formData,
    });

    if (!response.ok) {
      setIsSending(false);
      throw new Error("Unable to register snap name");
    }

    const responseData = await response.json();

    setTimeout(() => {
      if (responseData.success) {
        navigate("/snaps");
      } else {
        setRegistrationResponse(responseData.data);
        setIsSending(false);
      }
    }, 1000);
  };

  // Must satisfy the following requriements:
  // - Contain no more than 40 characters
  // - Consist of only lowercase letters, numbers, and hyphens
  // - Contain at least one letter
  // - Not start or end with a hyphen
  //
  // See: https://documentation.ubuntu.com/snapcraft/stable/how-to/publishing/register-a-snap/#name-your-snap
  const isValid = (): boolean => {
    const snapNamePattern = /^(?<!-)\d*[a-z][a-z0-9-]*(?<!-)$/;

    if (snapName && snapName.length < 40 && snapName.match(snapNamePattern)) {
      return true;
    }

    return false;
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col size={8}>
          <Select
            label="Store"
            options={availableStores.map((store) => ({
              label: store.name,
              value: store.id,
            }))}
            onChange={(e) => {
              setSelectedStore(e.target.value);

              if (e.target.value === "ubuntu") {
                setPrivacy("private");
              }
            }}
            required
          />
          <Input
            type="text"
            label="Snap name"
            defaultValue={snapName}
            onChange={(e) => {
              setSnapName(e.target.value);
            }}
            required
          />

          <Button
            type="button"
            appearance="link"
            onClick={() => {
              setShowSnapNameConstraints(!showSnapNameConstraints);
            }}
          >
            <small>
              {showSnapNameConstraints ? <>Hide</> : <>Show</>} snap name
              constraints
            </small>
          </Button>

          {showSnapNameConstraints && (
            <ul>
              <li>
                <small>Contain no more than 40 characters</small>
              </li>
              <li>
                <small>
                  Consist of only lowercase letters, numbers, and hyphens
                </small>
              </li>
              <li>
                <small>Contain at least one letter</small>
              </li>
              <li>
                <small>Not start or end with a hyphen</small>
              </li>
            </ul>
          )}

          <p>
            <label htmlFor="public">Snap privacy</label>
          </p>

          <p className="p-form-help-text">
            This can be changed at any time after the initial upload
          </p>
          <Input
            type="radio"
            label="Public"
            name="public"
            disabled={selectedStore === "ubuntu"}
            value="public"
            checked={privacy === "public"}
            onChange={(e) => {
              setPrivacy(e.target.value);
            }}
          />
          <Input
            type="radio"
            label="Private"
            name="public"
            help="Snap is hidden in stores and only accessible by the publisher and collaborators"
            disabled={selectedStore === "ubuntu"}
            value="private"
            checked={privacy === "private" || selectedStore === "ubuntu"}
            onChange={(e) => {
              setPrivacy(e.target.value);
            }}
          />
        </Col>
      </Row>
      <hr />
      <div className="u-align--right">
        <Button
          type="submit"
          appearance="positive"
          disabled={isSending || !isValid()}
        >
          {isSending ? (
            <>
              <Icon name="spinner" className="u-animation--spin" light />
              &nbsp;Registering
            </>
          ) : (
            <>Register</>
          )}
        </Button>
        <Link className="p-button" to="/snaps">
          Cancel
        </Link>
      </div>
    </Form>
  );
}

export default RegisterSnapForm;
