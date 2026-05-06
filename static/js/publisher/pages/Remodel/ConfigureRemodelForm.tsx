import { useMemo, useState, Dispatch, SetStateAction } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { useAtomValue } from "jotai";
import {
  Button,
  Input,
  Select,
  Icon,
  Notification,
} from "@canonical/react-components";

import { useModels } from "../../hooks";
import { brandIdState } from "../../state/brandStoreState";
import { remodelsListState } from "../../state/remodelsState";

import { setPageTitle } from "../../utils";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
  refetch: () => void;
  setErrorMessage: Dispatch<SetStateAction<string>>;
};

function ConfigureRemodelForm({
  refetch,
  setShowNotification,
  setShowErrorNotification,
  setErrorMessage,
}: Props): React.JSX.Element {
  const { id, modelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [targetModel, setTargetModel] = useState("");
  const [serial, setSerial] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectAllSerials, setSelectAllSerials] = useState(false);

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${modelId}/remodel`);
    setTargetModel("");
    setSerial("");
    setDescription("");
    setIsSaving(false);
    setTimeout(() => {
      setShowErrorNotification(false);
    }, 5000);
  };

  if (location.pathname.includes("/configure")) {
    setPageTitle("Configure a remodel");
  }

  const brandId = useAtomValue(brandIdState);
  const remodels = useAtomValue(remodelsListState);

  const { data: models, isLoading, error } = useModels(brandId);

  // Filters out the current model as you
  // can't remodel a model to the same model
  const targetModels = useMemo(() => {
    if (!models || isLoading || error) {
      return [];
    }

    return models.filter((m) => m.name !== modelId && m.name !== "undefined");
  }, [models, isLoading, error, modelId]);

  const isDisabled = () => {
    if (targetModel && serial) {
      return false;
    }

    if (targetModel && selectAllSerials) {
      return false;
    }

    return true;
  };

  const hasConflict = () => {
    const existingRemodel = remodels.find((remodel) => {
      const serialMatch = () => {
        if (!selectAllSerials && !serial) {
          return false;
        }

        return (
          remodel["from-serial"] === serial ||
          (remodel["from-serial"] === null && !serial)
        );
      };

      return (
        remodel["from-model"] === modelId &&
        remodel["to-model"] === targetModel &&
        serialMatch()
      );
    });

    if (existingRemodel) {
      return true;
    }

    return false;
  };

  const mutation = useMutation({
    mutationFn: () => {
      setIsSaving(true);

      return fetch(`/api/store/${brandId}/models/remodel-allowlist`, {
        method: "POST",
        body: JSON.stringify([
          {
            "from-model": modelId,
            "to-model": targetModel,
            // the store API reads `null` as all serials
            "from-serial": selectAllSerials ? null : serial,
            description: description,
          },
        ]),
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": window.CSRF_TOKEN,
        },
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["remodels"] });
      const previousRemodels = queryClient.getQueryData(["remodels"]);
      return { previousRemodels };
    },
    onError: ({ context }) => {
      queryClient.setQueryData(["remodels"], context?.previousRemodels);
      handleError();
      throw new Error("Unable to configure a new remodel");
    },
    onSettled: async (res) => {
      const responseData = await res?.json();

      if (!responseData.success) {
        let errorMessage = responseData.message;

        // Can't use the default message in this case
        // due to its formatting
        if (res?.status === 409) {
          errorMessage = "Requested remodel conflicts with existing remodels";
        }

        setErrorMessage(errorMessage);
        setShowErrorNotification(true);
      } else {
        setShowNotification(true);
        refetch();
      }

      setTargetModel("");
      setSerial("");
      setDescription("");

      queryClient.invalidateQueries({ queryKey: ["remodels"] });
      setIsSaving(false);
      navigate(`/admin/${id}/models/${modelId}/remodel`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title p-muted-heading">
            Configure a remodel
          </h4>
        </div>
        <div className="p-panel__content">
          {isSaving && (
            <div className="u-fixed-width">
              <p>
                <Icon name="spinner" className="u-animation--spin" />
                &nbsp;Configuring remodel...
              </p>
            </div>
          )}
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            <Select
              id="target-model"
              label="Select a target model"
              options={[{ label: "Select a model", value: "" }].concat(
                targetModels.map((m) => ({
                  label: m.name,
                  value: m.name,
                })),
              )}
              value={targetModel}
              required
              disabled={!models || models.length < 1}
              onChange={(e) => {
                setTargetModel(e.target.value);
              }}
            />
            <p className="u-no-margin--bottom">* Input devices to target</p>
            <div style={{ display: "flex", gap: "2rem" }}>
              <Input
                type="radio"
                label="Enter serial"
                name="serials"
                checked={!selectAllSerials}
                onChange={(e) => {
                  setSelectAllSerials(!e.target.checked);
                }}
              />
              <Input
                type="radio"
                label="All serials"
                name="serials"
                checked={selectAllSerials}
                onChange={(e) => {
                  setSelectAllSerials(e.target.checked);
                  setSerial("");
                }}
              />
            </div>
            {!selectAllSerials && (
              <Input
                id="input-devices"
                label="Input devices to target"
                labelClassName="u-hide"
                placeholder="Enter serial number"
                type="text"
                onChange={(e) => {
                  setSerial(e.target.value);
                }}
                value={serial}
                required
              />
            )}
            <Input
              id="note"
              label="Note (Max 140 characters)"
              placeholder="Add a note (optional)"
              type="text"
              maxLength={140}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              value={description}
            />
          </div>
          {hasConflict() && (
            <div className="u-fixed-width">
              <Notification severity="negative" title="Remodel conflict">
                There is an existing remodel with this configuration. Choose
                another target model or a different device to target.
              </Notification>
            </div>
          )}
          <div className="u-fixed-width">
            <hr />
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/models/${modelId}/remodel`}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={isDisabled() || hasConflict()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ConfigureRemodelForm;
