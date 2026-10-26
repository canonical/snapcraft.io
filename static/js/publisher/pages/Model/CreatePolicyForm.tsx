import {
  useState,
  useEffect,
  ChangeEvent,
  Dispatch,
  SetStateAction,
} from "react";
import { useAtomValue, useAtom } from "jotai";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { Button, Icon } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm, type FieldValues } from "react-hook-form";

import { setPageTitle } from "../../utils";
import RouterLinkButton from "../../components/RouterLinkButton";

import { useSigningKeys } from "../../hooks";
import {
  signingKeysListState,
  newSigningKeyState,
} from "../../state/signingKeysState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
  refetchPolicies: () => void;
};

function CreatePolicyForm({
  setShowNotification,
  setShowErrorNotification,
  refetchPolicies,
}: Props): React.JSX.Element {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isError, error, data } = useSigningKeys(id);
  const [signingKeys, setSigningKeys] = useAtom(signingKeysListState);
  const [newSigningKey, setNewSigningKey] = useAtom(newSigningKeyState);
  const brandStore = useAtomValue(brandStoreState(id));
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const methods = useForm<FieldValues>({
    values: { "signing-key": newSigningKey.name },
    mode: "onChange",
  });
  // Field memoizes input props; refresh options without losing selection.
  const signingKeyFieldKey = JSON.stringify(
    signingKeys.map((signingKey) => [signingKey.name, signingKey["sha3-384"]]),
  );

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${modelId}/policies`);
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

      return fetch(`/api/store/${brandId}/models/${modelId}/policies`, {
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
      navigate(`/admin/${id}/models/${modelId}/policies`);
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
    if (!isLoading && !error && data) {
      setSigningKeys(data);
    }
  }, [isLoading, error, data]);

  return (
    <div className="p-panel">
      <div className="p-panel__header">
        <h4 className="p-panel__title p-muted-heading">Create new policy</h4>
      </div>
      <div className="p-panel__content">
        <div className="u-fixed-width">
          <Form
            methods={methods}
            onSubmit={() => {
              mutation.mutate(newSigningKey.name);
            }}
          >
            {isLoading && <p>Fetching signing keys...</p>}
            {isError && error instanceof Error && <p>Error: {error.message}</p>}
            {isSaving && (
              <p>
                <Icon icon="spinner" className="u-animation--spin" />
                &nbsp;Adding new policy...
              </p>
            )}

            <Field
              key={signingKeyFieldKey}
              inputType="select"
              name="signing-key"
              id="signing-key"
              label="Signing key"
              disabled={signingKeys.length < 1}
              unregisterOnUnmount={false}
              options={[
                { label: "Select a signing key", value: "" },
                ...signingKeys.map((signingKey) => ({
                  label: signingKey.name,
                  value: signingKey["sha3-384"],
                })),
              ]}
              registerProps={{
                onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                  setNewSigningKey({ name: event.target.value });
                },
              }}
            />

            {signingKeys.length < 1 && (
              <p className="ds field-description p">
                No signing keys available, please{" "}
                <Link to={`/admin/${id}/models/signing-keys/create`}>
                  create one
                </Link>{" "}
                first.
              </p>
            )}
            <div>
              <hr className="pragma-hr" />
              <div className="u-align--right">
                <RouterLinkButton
                  importance="secondary"
                  to={`/admin/${id}/models/${modelId}/policies`}
                  onClick={() => {
                    setNewSigningKey({ name: "" });
                    setShowErrorNotification(false);
                  }}
                >
                  Cancel
                </RouterLinkButton>
                <Button
                  type="submit"
                  importance="primary"
                  anticipation="constructive"
                  style={{ marginLeft: "1rem" }}
                  disabled={!newSigningKey.name}
                >
                  Add policy
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default CreatePolicyForm;
