import { Dispatch, SetStateAction, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useAtomValue } from "jotai";
import { useMutation, useQueryClient } from "react-query";
import { Input, Button, Icon } from "@canonical/react-components";
import randomstring from "randomstring";

import { checkModelNameExists, setPageTitle } from "../../utils";

import {
  modelsListState,
  newModelState,
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
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);
  const [newModel, setNewModel] = useRecoilState(newModelState);
  const stores = useRecoilState(brandStoresState);
  const currentStore = stores[0].find((store: Store) => store.id === id);
  const modelsList = useRecoilValue(filteredModelsListState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const setModelsList = useSetRecoilState<Array<Model>>(modelsListState);
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const handleError = () => {
    setShowErrorNotification(true);
    setIsSaving(false);
    setModelsList((oldModelsList: Array<Model>) => {
      return oldModelsList.filter((model) => model.name !== newModel.name);
    });
    navigate(`/admin/${id}/models`);
    setNewModel({ name: "", apiKey: "" });
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

      setNewModel({ name: "", apiKey: "" });

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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ name: newModel.name, apiKey: newModel.apiKey });
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title">Create new model</h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            {currentStore && (
              <p>
                Brand
                <br />
                <strong>{currentStore.name}</strong>
              </p>
            )}
            {isSaving && (
              <p>
                <Icon name="spinner" className="u-animation--spin" />
                &nbsp;Creating new model...
              </p>
            )}
            <Input
              type="text"
              id="model-name-field"
              placeholder="e.g. display-name-123"
              label="Name"
              help="Name should contain lowercase alphanumeric characters and hyphens only"
              value={newModel.name}
              onChange={(e) => {
                const value = e.target.value;
                setNewModel({ ...newModel, name: value });
              }}
              error={
                checkModelNameExists(newModel.name, modelsList)
                  ? `Model ${newModel.name} already exists`
                  : null
              }
              required
            />
            <Input
              type="text"
              id="api-key-field"
              label="API key"
              value={newModel.apiKey}
              placeholder="yx6dnxsWQ3XUB5gza8idCuMvwmxtk1xBpa9by8TuMit5dgGnv"
              className="read-only-dark"
              style={{ color: "#000" }}
              readOnly
            />
            <Button
              type="button"
              className="u-no-margin--bottom"
              onClick={() => {
                setNewModel({
                  ...newModel,
                  apiKey: randomstring.generate({
                    length: 50,
                  }),
                });
              }}
            >
              Generate key
            </Button>
          </div>
          <div className="u-fixed-width">
            <hr />
            <p>* Mandatory field</p>
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/models`}
                onClick={() => {
                  setNewModel({ name: "", apiKey: "" });
                  setShowErrorNotification(false);
                }}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={
                  !newModel.name ||
                  checkModelNameExists(newModel.name, modelsList)
                }
              >
                Add model
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreateModelForm;
