import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { useMutation, useQueryClient } from "react-query";
import { Button, Icon } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm, type FieldValues } from "react-hook-form";
import randomstring from "randomstring";

import { checkModelNameExists, setPageTitle } from "../../utils";
import RouterLinkButton from "../../components/RouterLinkButton";
import useLatestRef from "../../hooks/useLatestRef";
import useRevalidateField from "../../hooks/useRevalidateField";

import {
  modelsListState,
  filteredModelsListState,
} from "../../state/modelsState";
import {
  brandStoresState,
  brandIdState,
  brandStoreState,
} from "../../state/brandStoreState";

import type { Store, Model } from "../../types/shared";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
};

function CreateModelForm({
  setShowNotification,
  setShowErrorNotification,
}: Props): React.JSX.Element {
  const API_KEY_LENGTH = 50;
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);
  const [newModelName, setNewModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const stores = useAtom(brandStoresState);
  const currentStore = stores[0].find((store: Store) => store.id === id);
  const modelsList = useAtomValue(filteredModelsListState);
  const brandStore = useAtomValue(brandStoreState(id));
  const setModelsList = useSetAtom(modelsListState);
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const methods = useForm<FieldValues>({
    values: { name: newModelName, apiKey },
    mode: "onChange",
    // Updating the API key must not clear an existing duplicate-name error.
    resetOptions: { keepErrors: true },
  });
  const { trigger, clearErrors } = methods;
  const modelsListRef = useLatestRef(modelsList);

  useRevalidateField(trigger, clearErrors, "name", newModelName, [modelsList]);
  useRevalidateField(trigger, clearErrors, "apiKey", apiKey, []);

  const handleError = () => {
    setShowErrorNotification(true);
    setIsSaving(false);
    setModelsList((oldModelsList: Array<Model>) => {
      return oldModelsList.filter((model) => model.name !== newModelName);
    });
    navigate(`/admin/${id}/models`);
    setNewModelName("");
    setApiKey("");
    setTimeout(() => {
      setShowErrorNotification(false);
    }, 5000);
  };

  const mutation = useMutation({
    mutationFn: (newModel: { name: string; apiKey: string }) => {
      setIsSaving(true);

      const formData = new FormData();

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("name", newModel.name);
      formData.set("api_key", newModel.apiKey);

      setNewModelName("");
      setApiKey("");
      setModelsList((oldModelsList: Array<Model>) => {
        return [
          {
            "api-key": newModel.apiKey,
            "created-at": new Date().toISOString(),
            name: newModel.name,
          },
          ...oldModelsList,
        ];
      });

      return fetch(`/api/store/${brandId}/models`, {
        method: "POST",
        body: formData,
      });
    },
    onMutate: async (newModel) => {
      await queryClient.cancelQueries({ queryKey: ["models"] });
      queryClient.setQueryData(["models"], () => [newModel]);
      return { previousModels: modelsList };
    },
    onError: ({ context }) => {
      queryClient.setQueryData(["models"], context?.previousModels);
      handleError();
      throw new Error("Unable to create a new model");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setShowNotification(true);
      setIsSaving(false);
      navigate(`/admin/${id}/models`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
  });

  if (location.pathname.includes("/create")) {
    brandStore
      ? setPageTitle(`Create model in ${brandStore.name}`)
      : setPageTitle("Create model");
  }

  return (
    <div className="p-panel">
      <div className="p-panel__header">
        <h4 className="p-panel__title p-muted-heading">Create new model</h4>
      </div>
      <div className="p-panel__content">
        <div className="u-fixed-width">
          {currentStore && (
            <p>
              Brand
              <br />
              <strong>{currentStore.name}</strong>
            </p>
          )}
          <Form
            methods={methods}
            onSubmit={() => {
              mutation.mutate({ name: newModelName, apiKey });
            }}
          >
            {isSaving && (
              <p>
                <Icon icon="spinner" className="u-animation--spin" />
                &nbsp;Creating new model...
              </p>
            )}
            <Field
              inputType="text"
              name="name"
              id="model-name-field"
              placeholder="e.g. display-name-123"
              label="Name"
              description="Name should contain lowercase alphanumeric characters and hyphens only"
              registerProps={{
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  setNewModelName(event.target.value);
                },
                validate: (name: string) =>
                  !checkModelNameExists(name, modelsListRef.current) ||
                  `Model ${name} already exists`,
              }}
            />
            <Field
              inputType="text"
              name="apiKey"
              id="api-key-field"
              label="API key"
              maxLength={API_KEY_LENGTH}
              registerProps={{
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  setApiKey(event.target.value);
                },
              }}
              description={`API key should be exactly ${API_KEY_LENGTH} alphanumeric characters long (${apiKey.length}/${API_KEY_LENGTH})`}
            />
            <div>
              {/* 
                Needs to be in a `div` otherwise the button
                is full-width, due to the `Form` component
                `display` property being `grid`
               */}
              <Button
                type="button"
                importance="secondary"
                onClick={() => {
                  setApiKey(randomstring.generate({ length: API_KEY_LENGTH }));
                }}
              >
                Generate key
              </Button>
            </div>
            <p className="ds field-description p">* Mandatory field</p>
            <div>
              <hr className="pragma-hr" />
              <div className="u-align--right">
                <RouterLinkButton
                  importance="secondary"
                  to={`/admin/${id}/models`}
                  onClick={() => {
                    setNewModelName("");
                    setApiKey("");
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
                  disabled={
                    !newModelName ||
                    apiKey.length !== API_KEY_LENGTH ||
                    checkModelNameExists(newModelName, modelsList)
                  }
                >
                  Add model
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default CreateModelForm;
