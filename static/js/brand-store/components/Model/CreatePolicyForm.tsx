import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { Button } from "@canonical/react-components";

import { signingKeysListState } from "../../atoms";

import type { Query } from "../../types/shared";

type Props = {
  setShowNotification: Function;
  setShowErrorNotification: Function;
  refetchPolicies: Function;
};

function CreatePolicyForm({
  setShowNotification,
  setShowErrorNotification,
  refetchPolicies,
}: Props) {
  const getSigningKeys = async () => {
    const response = await fetch(`/admin/store/${id}/signing-keys`);

    if (!response.ok) {
      throw new Error("There was a problem fetching signing keys");
    }

    const signingKeysData = await response.json();

    if (!signingKeysData.success) {
      throw new Error(signingKeysData.message);
    }

    setSigningKeys(signingKeysData.data);
  };

  const { id, model_id } = useParams();
  const navigate = useNavigate();
  const { isLoading, isError, error }: Query = useQuery(
    "signingKeys",
    getSigningKeys
  );
  const [signingKeys, setSigningKeys] = useRecoilState(signingKeysListState);
  const [selectedSigningKey, setSelectedSigningKey] = useState("");

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${model_id}/policies`);
    setSelectedSigningKey("");
    setTimeout(() => {
      setShowErrorNotification(false);
    }, 5000);
  };

  const mutation = useMutation({
    mutationFn: (policySigningKey: string) => {
      const formData = new FormData();

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("signing_key", policySigningKey);

      navigate(`/admin/${id}/models/${model_id}/policies`);

      return fetch(`/admin/store/${id}/models/${model_id}/policies`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        handleError();
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const policiesData = await response.json();

      if (!policiesData.success) {
        throw new Error(policiesData.message);
      }

      setShowNotification(true);
      setSelectedSigningKey("");
      refetchPolicies();
      navigate(`/admin/${id}/models/${model_id}/policies`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
    onError: () => {
      handleError();
      throw new Error("Unable to create a new policy");
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(selectedSigningKey);
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title">Create new policy</h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width">
            {isLoading && <p>Fetching signing keys...</p>}
            {isError && error && <p>Error: {error.message}</p>}

            <label htmlFor="signing-key">Signing key</label>
            <select
              name="signing-key"
              id="signing-key"
              required
              disabled={signingKeys.length < 1}
              value={selectedSigningKey}
              onChange={(event) => {
                setSelectedSigningKey(event.target.value);
              }}
            >
              <option value="">Select a signing key</option>
              {signingKeys.map((signingKey) => (
                <option
                  key={signingKey.fingerprint}
                  value={signingKey["sha3-384"]}
                >
                  {signingKey.name}
                </option>
              ))}
            </select>

            {signingKeys.length < 1 && (
              <p className="p-form-help-text">
                No signing keys available, please{" "}
                <Link to={`/admin/${id}/models/signing-keys/create`}>
                  create one
                </Link>{" "}
                first.
              </p>
            )}
          </div>
        </div>
        <hr />
        <div className="p-panel__footer u-align--right">
          <div className="u-fixed-width">
            <Button
              className="u-no-margin--bottom"
              onClick={() => {
                navigate(`/admin/${id}/models/${model_id}/policies`);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              appearance="positive"
              className="u-no-margin--bottom u-no-margin--right"
              disabled={!selectedSigningKey}
            >
              Add policy
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreatePolicyForm;
