import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useAtomValue as useJotaiValue } from "jotai";
import { useMutation } from "react-query";
import { format } from "date-fns";
import randomstring from "randomstring";
import {
  Row,
  Col,
  Button,
  Input,
  Notification,
} from "@canonical/react-components";

import { modelsListState, currentModelState } from "../../state/modelsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";

import ModelNav from "./ModelNav";
import ModelBreadcrumb from "./ModelBreadcrumb";
import Navigation from "../../components/Navigation";

import { useModels } from "../../hooks";
import { setPageTitle } from "../../utils";
import type { Model as ModelType } from "../../types/shared";

function Model() {
  const { id, model_id } = useParams();
  const brandId = useJotaiValue(brandIdState);
  const currentModel = useRecoilValue(currentModelState(model_id));
  const [newApiKey, setNewApiKey] = useState("");
  const [showSuccessNotification, setShowSuccessNotificaton] = useState(false);
  const [showErrorNotification, setShowErrorNotificaton] = useState(false);
  const setModelsList = useSetRecoilState<ModelType[]>(modelsListState);
  const brandStore = useRecoilValue(brandStoreState(id));

  const mutation = useMutation({
    mutationFn: (apiKey: string) => {
      const formData = new FormData();
      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("api_key", apiKey);

      return fetch(`/api/store/${brandId}/models/${model_id}`, {
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: (response) => {
      if (!response.ok) {
        handleError();
        throw new Error(`${response.status} ${response.statusText}`);
      }

      if (response.ok) {
        setShowSuccessNotificaton(true);
        setTimeout(() => {
          setShowSuccessNotificaton(false);
        }, 5000);
      }
    },
    onError: () => {
      handleError();
      throw new Error("Unable to create a new model");
    },
  });

  const {
    data: models,
    isLoading: modelsIsLoading,
    error: modelsError,
  }: {
    data: ModelType[] | undefined;
    isLoading: boolean;
    error: unknown;
  } = useModels(brandId);

  const handleError = () => {
    setShowErrorNotificaton(true);
    setTimeout(() => {
      setShowErrorNotificaton(false);
    }, 5000);
  };

  currentModel && brandStore
    ? setPageTitle(`${currentModel.name} in ${brandStore.name}`)
    : setPageTitle("Model");

  useEffect(() => {
    if (!currentModel && !modelsIsLoading && models) {
      setModelsList(models);
    }

    if (modelsError) {
      if (modelsError instanceof Error) {
        console.error(modelsError.message);
      }
    }
  }, [currentModel, modelsIsLoading, modelsError, models]);

  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName="models" />
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <ModelBreadcrumb />
            </div>
            <div className="u-fixed-width">
              <ModelNav sectionName="overview" />
            </div>
            {showSuccessNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="positive"
                  onDismiss={() => {
                    setShowSuccessNotificaton(false);
                  }}
                >
                  Model updated successfully
                </Notification>
              </div>
            )}
            {showErrorNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="negative"
                  onDismiss={() => {
                    setShowErrorNotificaton(false);
                  }}
                >
                  Unable to update model
                </Notification>
              </div>
            )}
            <div className="u-fixed-width u-align--right">
              <Button
                type="button"
                onClick={() => {
                  setNewApiKey("");
                }}
                disabled={!newApiKey}
              >
                Revert
              </Button>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--right"
                disabled={!newApiKey}
                form="save-model-form"
              >
                Save
              </Button>
            </div>

            {currentModel && (
              <form
                className="p-form p-form--stacked"
                id="save-model-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate(newApiKey);
                }}
              >
                <Row>
                  <Col size={3}>
                    <p>Name</p>
                  </Col>
                  <Col size={9}>
                    <p>{currentModel.name}</p>
                  </Col>
                </Row>
                <div className="u-fixed-width">
                  <hr />
                </div>
                <Row>
                  <Col size={3}>
                    <p>Series</p>
                  </Col>
                  <Col size={9}>
                    <p>{currentModel.series}</p>
                  </Col>
                </Row>
                <div className="u-fixed-width">
                  <hr />
                </div>
                <Row>
                  <Col size={3}>
                    <p>API key</p>
                  </Col>
                  <Col size={6}>
                    <Input
                      type="text"
                      id="api-key-field"
                      label="API key"
                      labelClassName="u-off-screen"
                      value={newApiKey || currentModel["api-key"] || ""}
                      placeholder="yx6dnxsWQ3XUB5gza8idCuMvwmxtk1xBpa9by8TuMit5dgGnv"
                      className="read-only-dark u-no-margin--bottom"
                      style={{ color: "#000" }}
                      readOnly
                    />
                  </Col>
                  <Col size={3} className="u-align--right">
                    <Button
                      type="button"
                      className="u-no-margin--bottom"
                      onClick={() => {
                        setNewApiKey(
                          randomstring.generate({
                            length: 50,
                          }),
                        );
                      }}
                    >
                      Generate key
                    </Button>
                  </Col>
                </Row>
                <div className="u-fixed-width">
                  <hr />
                </div>
                <Row>
                  <Col size={3}>
                    <p>Creation date</p>
                  </Col>
                  <Col size={9}>
                    <p>
                      {format(
                        new Date(currentModel["created-at"]),
                        "dd/MM/yyyy",
                      )}
                    </p>
                  </Col>
                </Row>
                {currentModel["created-by"] && (
                  <>
                    <div className="u-fixed-width">
                      <hr />
                    </div>
                    <Row>
                      <Col size={3}>
                        <p>Created by</p>
                      </Col>
                      <Col size={9}>
                        <p>{currentModel["created-by"]["display-name"]}</p>
                      </Col>
                    </Row>
                  </>
                )}
                {currentModel["modified-at"] && currentModel["modified-by"] && (
                  <>
                    <div className="u-fixed-width">
                      <hr />
                    </div>
                    <Row>
                      <Col size={3}>
                        <p>Last updated</p>
                      </Col>
                      <Col size={9}>
                        <p>
                          {format(
                            new Date(currentModel["modified-at"]),
                            "dd/MM/yyyy",
                          )}
                        </p>
                      </Col>
                    </Row>
                    <div className="u-fixed-width">
                      <hr />
                    </div>
                    <Row>
                      <Col size={3}>
                        <p>Modified by</p>
                      </Col>
                      <Col size={9}>
                        <p>{currentModel["modified-by"]["display-name"]}</p>
                      </Col>
                    </Row>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Model;
