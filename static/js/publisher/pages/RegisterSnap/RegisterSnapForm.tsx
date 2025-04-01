import {
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
  FormEvent,
} from "react";
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
}: Props): ReactNode {
  const [snapName, setSnapName] = useState<string>();
  const [privacy, setPrivacy] = useState<string>("private");

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
          <label htmlFor="public">Snap privacy</label>
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
          disabled={!snapName || isSending}
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
