import {
  ChangeEvent,
  Dispatch,
  useEffect,
  useRef,
  useState,
  SetStateAction,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { useMutation, useQueryClient } from "react-query";
import { Icon, Button } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm, type FieldValues } from "react-hook-form";

import { checkSigningKeyExists, setPageTitle } from "../../utils";
import RouterLinkButton from "../../components/RouterLinkButton";

import {
  signingKeysListState,
  filteredSigningKeysListState,
  newSigningKeyState,
} from "../../state/signingKeysState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";

import type { SigningKey } from "../../types/shared";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  refetch: () => void;
};

function CreateSigningKeyForm({
  setShowNotification,
  setErrorMessage,
  refetch,
}: Props): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);
  const [newSigningKey, setNewSigningKey] = useAtom(newSigningKeyState);
  const signingKeysList = useAtomValue(filteredSigningKeysListState);
  const brandStore = useAtomValue(brandStoreState(id));
  const setSigningKeysList = useSetAtom(signingKeysListState);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const methods = useForm<FieldValues>({
    values: newSigningKey,
    mode: "onChange",
  });
  const { trigger, clearErrors } = methods;
  // Field memoizes registration options, so validation needs the latest list
  const signingKeysListRef = useRef(signingKeysList);
  signingKeysListRef.current = signingKeysList;

  useEffect(() => {
    if (newSigningKey.name) {
      void trigger("name");
    } else {
      clearErrors("name");
    }
  }, [newSigningKey.name, signingKeysList, trigger, clearErrors]);

  const handleError = () => {
    setSigningKeysList((oldSigningKeysList: Array<SigningKey>) => {
      return oldSigningKeysList.filter(
        (signingKey) => signingKey.name !== newSigningKey.name,
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

      return fetch(`/api/store/${brandId}/signing-keys`, {
        method: "POST",
        body: formData,
      });
    },
    onMutate: async (newSigningKey) => {
      await queryClient.cancelQueries({ queryKey: ["signingKeys"] });
      const previousSigningKeys = queryClient.getQueryData(["signingKeys"]);
      queryClient.setQueryData(["signingKeys"], () => [newSigningKey]);
      return { previousSigningKeys };
    },
    onError: ({ context }) => {
      queryClient.setQueryData(["signingKeys"], context?.previousSigningKeys);
      handleError();
      throw new Error("Unable to create signing key");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["signingKeys"] });
      refetch();
      setShowNotification(true);
      setIsSaving(false);
      navigate(`/admin/${id}/signing-keys`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
  });

  if (location.pathname.includes("/create")) {
    brandStore
      ? setPageTitle(`Create signing key in ${brandStore.name}`)
      : setPageTitle("Create signing key");
  }

  return (
    <div className="p-panel">
      <div className="p-panel__header">
        <h4 className="p-panel__title p-muted-heading">Create signing key</h4>
      </div>
      <div className="p-panel__content">
        <div className="u-fixed-width">
          <Form
            methods={methods}
            onSubmit={() => {
              mutation.mutate({ name: newSigningKey.name });
            }}
          >
            {isSaving && (
              <p>
                <Icon icon="spinner" className="u-animation--spin" />
                &nbsp;Adding new signing key...
              </p>
            )}
            <Field
              inputType="text"
              name="name"
              id="signing-key-name-field"
              placeholder="e.g. display-name-123"
              label="Signing key name"
              description="Name should contain lowercase alphanumeric characters and hyphens only"
              registerProps={{
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  setNewSigningKey({ name: event.target.value });
                },
                validate: (name: string) =>
                  !checkSigningKeyExists(name, signingKeysListRef.current) ||
                  `Signing key ${name} already exists`,
              }}
            />
            <p className="ds field-description p">* Mandatory field</p>
            <div>
              <hr className="pragma-hr" />
              <div className="u-align--right">
                <RouterLinkButton
                  to={`/admin/${id}/signing-keys`}
                  importance="secondary"
                  onClick={() => {
                    setNewSigningKey({ name: "" });
                    setErrorMessage("");
                  }}
                >
                  Cancel
                </RouterLinkButton>
                <Button
                  type="submit"
                  importance="primary"
                  anticipation="constructive"
                  disabled={
                    !newSigningKey.name ||
                    checkSigningKeyExists(newSigningKey.name, signingKeysList)
                  }
                  style={{ marginLeft: "1rem" }}
                >
                  Add signing key
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default CreateSigningKeyForm;
