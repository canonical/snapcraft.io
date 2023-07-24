import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMutation, useQuery } from "react-query";
import { format } from "date-fns";
import randomstring from "randomstring";
import {
  Row,
  Col,
  Button,
  Input,
  Notification,
} from "@canonical/react-components";

import { modelsListState } from "../../atoms";
import { currentModelState } from "../../selectors";

import ModelNav from "./ModelNav";

function Model() {
  const getModels = async () => {
    if (currentModel) {
      return;
    }

    const response = await fetch(`/admin/store/${id}/models`);

    if (!response.ok) {
      throw new Error("There was a problem fetching models");
    }

    const modelsData = await response.json();

    if (!modelsData.success) {
      throw new Error(modelsData.message);
    }

    setModelsList(modelsData.data);
  };

  const mutation = useMutation({
    mutationFn: (apiKey: string) => {
      const formData = new FormData();
      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("api_key", apiKey);

      return fetch(`/admin/store/${id}/models/${model_id}`, {
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

  const { id, model_id } = useParams();
  const currentModel = useRecoilValue(currentModelState(model_id));
  const [newApiKey, setNewApiKey] = useState("");
  const [showSuccessNotification, setShowSuccessNotificaton] = useState(false);
  const [showErrorNotification, setShowErrorNotificaton] = useState(false);
  const setModelsList = useSetRecoilState<any>(modelsListState);

  useQuery("models", getModels);

  const handleError = () => {
    setShowErrorNotificaton(true);
    setTimeout(() => {
      setShowErrorNotificaton(false);
    }, 5000);
  };

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <Link to={`/admin/${id}/models`}>&lsaquo;&nbsp;Models</Link>
          </div>
          <div className="u-fixed-width">
            <h1>{model_id}</h1>
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
          <Row>
            <Col size={8}>
              {currentModel && (
                <form
                  className="p-form p-form--stacked"
                  onSubmit={(event) => {
                    event.preventDefault();
                    mutation.mutate(newApiKey);
                  }}
                >
                  <div className="p-form__group">
                    <Row>
                      <Col size={2}>
                        <span className="p-form__label">Name</span>
                      </Col>
                      <Col size={6}>
                        <div className="p-form__control">
                          <strong>{currentModel.name}</strong>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <div className="p-form__group">
                    <Row>
                      <Col size={2}>
                        <span className="p-form__label">Series</span>
                      </Col>
                      <Col size={6}>
                        <div className="p-form__control">
                          {currentModel.series}
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <div className="p-form__group">
                    <Row>
                      <Col size={2}>
                        <span className="p-form__label">API key</span>
                      </Col>
                      <Col size={6}>
                        <div className="p-form__control">
                          <Input
                            type="text"
                            id="api-key-field"
                            label="API key"
                            labelClassName="u-off-screen"
                            value={newApiKey || currentModel["api-key"] || ""}
                            placeholder="yx6dnxsWQ3XUB5gza8idCuMvwmxtk1xBpa9by8TuMit5dgGnv"
                            className="read-only-dark"
                            style={{ color: "#000" }}
                            readOnly
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              setNewApiKey(
                                randomstring.generate({
                                  length: 50,
                                })
                              );
                            }}
                          >
                            Generate key
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <div className="p-form__group">
                    <Row>
                      <Col size={2}>
                        <span className="p-form__label">Creation date</span>
                      </Col>
                      <Col size={6}>
                        <div className="p-form__control">
                          {format(
                            new Date(currentModel["created-at"]),
                            "dd/MM/yyyy"
                          )}
                        </div>
                      </Col>
                    </Row>
                    {currentModel["created-by"] && (
                      <Row>
                        <Col size={2}>
                          <span className="p-form__label">Created by</span>
                        </Col>
                        <Col size={6}>
                          <div className="p-form__control">
                            {currentModel["created-by"]["display-name"]}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                  {currentModel["modified-at"] && currentModel["modified-by"] && (
                    <div className="p-form__group">
                      <Row>
                        <Col size={2}>
                          <span className="p-form__label">Last updated</span>
                        </Col>
                        <Col size={6}>
                          <div className="p-form__control">
                            {format(
                              new Date(currentModel["modified-at"]),
                              "dd/MM/yyyy"
                            )}
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col size={2}>
                          <span className="p-form__label">Modified by</span>
                        </Col>
                        <Col size={6}>
                          <div className="p-form__control">
                            {currentModel["modified-by"]["display-name"]}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  <hr style={{ marginTop: "1rem", marginBottom: "1rem" }} />
                  <div className="u-align--right">
                    <Button
                      onClick={() => {
                        setNewApiKey("");
                      }}
                    >
                      Revert
                    </Button>
                    <Button
                      type="submit"
                      appearance="positive"
                      className="u-no-margin--right"
                      disabled={!newApiKey}
                    >
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </main>
  );
}

export default Model;
