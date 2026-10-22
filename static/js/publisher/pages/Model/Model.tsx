import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "react-query";
import { format } from "date-fns";
import randomstring from "randomstring";
import { Row, Col, Notification } from "@canonical/react-components";
import { Button } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm } from "react-hook-form";
import type { ChangeEvent } from "react";
import type { FieldValues } from "react-hook-form";

import { modelsListState } from "../../state/modelsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { useModels } from "../../hooks";
import { setPageTitle } from "../../utils";
import type { Model as ModelType } from "../../types/shared";
import { PortalEntrance } from "../Portals/Portals";

function Model() {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const [apiKey, setApiKey] = useState("");
  const [showSuccessNotification, setShowSuccessNotificaton] = useState(false);
  const [showErrorNotification, setShowErrorNotificaton] = useState(false);
  const methods = useForm<FieldValues>({
    values: { apiKey },
  });
  const setModelsList = useSetAtom(modelsListState);
  const brandStore = useAtomValue(brandStoreState(id));

  const mutation = useMutation({
    mutationFn: (apiKey: string) => {
      const formData = new FormData();
      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("api_key", apiKey);

      return fetch(`/api/store/${brandId}/models/${modelId}`, {
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
        refetch();
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
    refetch,
  }: {
    data: ModelType[] | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  } = useModels(brandId);

  const handleError = () => {
    setShowErrorNotificaton(true);
    setTimeout(() => {
      setShowErrorNotificaton(false);
    }, 5000);
  };

  const currentModel = useMemo(() => {
    if (!models) {
      return;
    }

    const current = models.find((model) => model.name === modelId);

    if (!current) {
      return;
    }

    if (current["api-key"]) {
      setApiKey(current["api-key"]);
    }

    return current;
  }, [models, modelId]);

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
    <>
      {currentModel && !currentModel["api-key"] && (
        <div className="u-fixed-width u-align--right">
          <Button
            type="button"
            importance="secondary"
            onClick={() => {
              setApiKey("");
            }}
            disabled={!apiKey}
            style={{ marginRight: "1rem" }}
          >
            Revert
          </Button>
          <Button
            type="submit"
            importance="primary"
            anticipation="constructive"
            disabled={!apiKey}
            loading={mutation.isLoading}
            form="save-model-form"
          >
            Save
          </Button>
        </div>
      )}

      {currentModel && (
        <>
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
              <Form
                id="save-model-form"
                methods={methods}
                onSubmit={() => {
                  mutation.mutate(apiKey);
                }}
              >
                <Field
                  inputType="text"
                  name="apiKey"
                  id="api-key-field"
                  label="API key"
                  className="update-model-input"
                  readOnly={currentModel["api-key"] !== null}
                  registerProps={{
                    onChange: (event: ChangeEvent<HTMLInputElement>) => {
                      if (currentModel["api-key"] !== null) {
                        return;
                      }

                      setApiKey(event.target.value);
                    },
                  }}
                />
              </Form>
            </Col>
            {!currentModel["api-key"] && (
              <Col size={3} className="u-align--right">
                <Button
                  type="button"
                  importance="secondary"
                  style={{ marginBottom: 0 }}
                  onClick={() => {
                    setApiKey(
                      randomstring.generate({
                        length: 50,
                      }),
                    );
                  }}
                >
                  Generate key
                </Button>
              </Col>
            )}
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
                {format(new Date(currentModel["created-at"]), "dd/MM/yyyy")}
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
        </>
      )}

      <PortalEntrance name="notification">
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
      </PortalEntrance>
    </>
  );
}

export default Model;
