import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useMutation } from "react-query";
import { Input, Button } from "@canonical/react-components";
import randomstring from "randomstring";

import { checkModelNameExists, setPageTitle } from "../../utils";

import { brandStoresState, modelsListState, newModelState } from "../../atoms";
import { filteredModelsListState, brandStoreState } from "../../selectors";

import type { Store, Model } from "../../types/shared";

type Props = {
  setShowNotification: Function;
  setShowErrorNotification: Function;
};

function CreateModelForm({
  setShowNotification,
  setShowErrorNotification,
}: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newModel, setNewModel] = useRecoilState(newModelState);
  const stores = useRecoilState(brandStoresState);
  const currentStore = stores[0].find((store: Store) => store.id === id);
  const modelsList = useRecoilValue(filteredModelsListState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const setModelsList = useSetRecoilState<Array<Model>>(modelsListState);

  const handleError = () => {
    setShowErrorNotification(true);
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
      const formData = new FormData();

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("name", newModel.name);
      formData.set("api_key", newModel.apiKey);

      navigate(`/admin/${id}/models`);

      setModelsList((oldModelsList: Array<Model>) => {
        return [
          {
            "api-key": newModel.apiKey,
            "created-at": new Date().toISOString(),
            "modified-at": new Date().toISOString(),
            name: newModel.name,
          },
          ...oldModelsList,
        ];
      });

      return fetch(`/admin/store/${id}/models`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        handleError();
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const modelsData = await response.json();

      if (!modelsData.success) {
        throw new Error(modelsData.message);
      }

      setShowNotification(true);
      setNewModel({ name: "", apiKey: "" });
      navigate(`/admin/${id}/models`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
    onError: () => {
      handleError();
      throw new Error("Unable to create a new model");
    },
  });

  brandStore
    ? setPageTitle(`Create model in ${brandStore.name}`)
    : setPageTitle("Create model");

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
          <h4 className="p-panel__title p-muted-heading">Create new model</h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            {currentStore && (
              <p>
                Brand
                <br />
                {currentStore.name}
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
            <p>* Mandatory field</p>
            <hr />
            <div className="u-align--right">
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  navigate(`/admin/${id}/models`);
                }}
              >
                Cancel
              </Button>
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
