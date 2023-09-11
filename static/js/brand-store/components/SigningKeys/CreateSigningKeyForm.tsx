import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useMutation } from "react-query";
import { Input, Button, Icon } from "@canonical/react-components";

import { checkSigningKeyExists, setPageTitle } from "../../utils";

import { signingKeysListState, newSigningKeyState } from "../../atoms";
import { filteredSigningKeysListState, brandStoreState } from "../../selectors";

import type { SigningKey } from "../../types/shared";

type Props = {
  setShowNotification: Function;
  setErrorMessage: Function;
  refetch: Function;
};

function CreateSigningKeyForm({
  setShowNotification,
  setErrorMessage,
  refetch,
}: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newSigningKey, setNewSigningKey] = useRecoilState(newSigningKeyState);
  const signingKeysList = useRecoilValue(filteredSigningKeysListState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const setSigningKeysList = useSetRecoilState<Array<SigningKey>>(
    signingKeysListState
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleError = () => {
    setSigningKeysList((oldSigningKeysList: Array<SigningKey>) => {
      return oldSigningKeysList.filter(
        (signingKey) => signingKey.name !== newSigningKey.name
      );
    });
    navigate(`/admin/${id}/signing-keys`);
    setNewSigningKey({ name: "" });
    setIsSaving(false);
    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  const mutation = useMutation({
    mutationFn: (newSigningKey: { name: string }) => {
      setIsSaving(true);

      const formData = new FormData();

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("name", newSigningKey.name);

      setNewSigningKey({ name: "" });

      setSigningKeysList((oldSigningKeysList: Array<SigningKey>) => {
        return [
          {
            name: newSigningKey.name,
            "created-at": new Date().toISOString(),
            "modified-at": new Date().toISOString(),
          },
          ...oldSigningKeysList,
        ];
      });

      return fetch(`/admin/store/${id}/signing-keys`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        handleError();
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const signingKeysData = await response.json();

      if (!signingKeysData.success) {
        setErrorMessage(signingKeysData.message);
        throw new Error(signingKeysData.message);
      }

      refetch();
      setShowNotification(true);
      setIsSaving(false);
      navigate(`/admin/${id}/signing-keys`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
    onError: () => {
      handleError();
      throw new Error("Unable to create signing key");
    },
  });

  brandStore
    ? setPageTitle(`Create signing key in ${brandStore.name}`)
    : setPageTitle("Create signing key");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ name: newSigningKey.name });
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title p-muted-heading">Create signing key</h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            {isSaving && (
              <p>
                <Icon name="spinner" className="u-animation--spin" />
                &nbsp;Adding new signing key...
              </p>
            )}
            <Input
              type="text"
              id="signing-key-name-field"
              placeholder="e.g. display-name-123"
              label="Signing key name"
              help="Name should contain lowercase alphanumeric characters and hyphens only"
              value={newSigningKey.name}
              onChange={(e) => {
                const value = e.target.value;
                setNewSigningKey({ ...newSigningKey, name: value });
              }}
              error={
                checkSigningKeyExists(newSigningKey.name, signingKeysList)
                  ? `Signing key ${newSigningKey.name} already exists`
                  : null
              }
              required
            />
          </div>
          <div className="u-fixed-width">
            <p>* Mandatory field</p>
            <hr />
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/signing-keys`}
                onClick={() => {
                  setNewSigningKey({ name: "" });
                  setErrorMessage("");
                }}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={
                  !newSigningKey.name ||
                  checkSigningKeyExists(newSigningKey.name, signingKeysList)
                }
              >
                Add signing key
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreateSigningKeyForm;
