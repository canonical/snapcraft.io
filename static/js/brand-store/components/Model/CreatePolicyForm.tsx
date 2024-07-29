import {
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { Button, Icon } from "@canonical/react-components";

import { setPageTitle } from "../../utils";

import { useSigningKeys } from "../../hooks";
import {
  signingKeysListState,
  newSigningKeyState,
  brandIdState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
  refetchPolicies: Function;
};

function CreatePolicyForm({
  setShowNotification,
  setShowErrorNotification,
  refetchPolicies,
}: Props): ReactNode {
  const { id, model_id } = useParams();
  const brandId = useRecoilValue(brandIdState);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isError, error, data }: any = useSigningKeys(brandId);
  const [signingKeys, setSigningKeys] = useRecoilState(signingKeysListState);
  const [newSigningKey, setNewSigningKey] = useRecoilState(newSigningKeyState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${model_id}/policies`);
    setNewSigningKey({ name: "" });
    setIsSaving(false);
    setTimeout(() => {
      setShowErrorNotification(false);
    }, 5000);
  };

  const mutation = useMutation({
    mutationFn: (policySigningKey: string) => {
      setIsSaving(true);

      const formData = new FormData();

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("signing_key", policySigningKey);

      setNewSigningKey({ name: "" });

      return fetch(`/admin/store/${brandId}/models/${model_id}/policies`, {
        method: "POST",
        body: formData,
      });
    },
    onMutate: async (newPolicy) => {
      await queryClient.cancelQueries({ queryKey: ["policies"] });
      const previousPolicies = queryClient.getQueryData(["policies"]);
      queryClient.setQueryData(["policies"], () => [newPolicy]);
      return { previousPolicies };
    },
    onError: ({ context }) => {
      queryClient.setQueryData(["policies"], context?.previousPolicies);
      handleError();
      throw new Error("Unable to create a new policy");
    },
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setShowNotification(true);
      setIsSaving(false);
      refetchPolicies();
      navigate(`/admin/${id}/models/${model_id}/policies`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
  });

  if (location.pathname.includes("/create")) {
    brandStore
      ? setPageTitle(`Create policy in ${brandStore.name}`)
      : setPageTitle("Create policy");
  }

  useEffect(() => {
    if (!isLoading && !error) {
      setSigningKeys(data);
    }
  }, [isLoading, error, data]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(newSigningKey.name);
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title p-muted-heading">Create new policy</h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            {isLoading && <p>Fetching signing keys...</p>}
            {isError && error && <p>Error: {error.message}</p>}

            {isSaving && (
              <p>
                <Icon name="spinner" className="u-animation--spin" />
                &nbsp;Adding new policy...
              </p>
            )}

            <label htmlFor="signing-key">Signing key</label>
            <select
              name="signing-key"
              id="signing-key"
              required
              disabled={signingKeys.length < 1}
              value={newSigningKey.name}
              onChange={(event) => {
                setNewSigningKey({
                  name: event.target.value,
                });
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
          <div className="u-fixed-width">
            <hr />
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/models/${model_id}/policies`}
                onClick={() => {
                  setNewSigningKey({ name: "" });
                  setShowErrorNotification(false);
                }}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={!newSigningKey.name}
              >
                Add policy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreatePolicyForm;
