import { useState, Dispatch, SetStateAction, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";
import { Button } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm, type FieldValues } from "react-hook-form";

import RouterLinkButton from "../../components/RouterLinkButton";

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
  const [showSnapNameConstraints, setShowSnapNameConstraints] =
    useState<boolean>(false);

  const methods = useForm<FieldValues>({
    defaultValues: {
      store: selectedStore,
      snapName: "",
      privacy: "private",
    },
  });
  const snapName: string | undefined = methods.watch("snapName");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsSending(true);

    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);
    formData.set("snap_name", snapName || "");
    formData.set("store", selectedStore);
    formData.set(
      "is_private",
      selectedStore === "ubuntu" ? "private" : methods.getValues("privacy"),
    );

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

  const isGlobalStore = selectedStore === "ubuntu";

  return (
    <Row>
      <Col size={8}>
        <Form methods={methods} onSubmit={handleSubmit}>
          <Field
            inputType="select"
            name="store"
            id="store"
            label="Store"
            options={availableStores.map((store) => ({
              label: store.name,
              value: store.id,
            }))}
            registerProps={{
              onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                setSelectedStore(event.target.value);

                if (event.target.value === "ubuntu") {
                  methods.setValue("privacy", "private");
                }
              },
            }}
          />
          <Field
            inputType="text"
            name="snapName"
            id="snap-name"
            label="Snap name"
          />

          <div>
            {/*
              Needs to be in a `div` otherwise the button
              is full-width, due to the `Form` component
              `display` property being `grid`
            */}
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setShowSnapNameConstraints(!showSnapNameConstraints);
              }}
            >
              <small>
                {showSnapNameConstraints ? <>Hide</> : <>Show</>} snap name
                constraints
              </small>
            </Button>
          </div>

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

          <Field
            // Field memoizes input props; remount to refresh `disabled`.
            key={isGlobalStore ? "locked" : "unlocked"}
            inputType="choices"
            name="privacy"
            label="Snap privacy"
            description="This can be changed at any time after the initial upload"
            options={[
              { label: "Public", value: "public" },
              {
                label:
                  "Private (Private snaps are hidden in stores and only accessible by the publisher and collaborators)",
                value: "private",
              },
            ]}
            disabled={isGlobalStore}
            unregisterOnUnmount={false}
            isOptional
          />

          <p className="ds field-description p">* Mandatory field</p>
          <div>
            <hr className="pragma-hr" />
            <div className="u-align--right">
              <RouterLinkButton importance="secondary" to="/snaps">
                Cancel
              </RouterLinkButton>
              <Button
                type="submit"
                importance="primary"
                anticipation="constructive"
                style={{ marginLeft: "1rem" }}
                disabled={isSending || !isValid()}
                loading={isSending}
              >
                {isSending ? "Registering" : "Register"}
              </Button>
            </div>
          </div>
        </Form>
      </Col>
    </Row>
  );
}

export default RegisterSnapForm;
