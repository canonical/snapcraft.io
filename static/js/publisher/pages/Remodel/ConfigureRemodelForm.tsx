import { useMemo, useState, Dispatch, SetStateAction } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { useAtomValue } from "jotai";
import { Button, Input, Select, Icon } from "@canonical/react-components";

import { useModels } from "../../hooks";
import { brandIdState } from "../../state/brandStoreState";

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
  const { id, model_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [targetModel, setTargetModel] = useState("");
  const [serials, setSerials] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${model_id}/remodel`);
    setTargetModel("");
    setSerials("");
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

  const { data: models, isLoading, error } = useModels(brandId);

  // Filters out the current model as you
  // can't remodel a model to the same model
  const targetModels = useMemo(() => {
    if (!models || isLoading || error) {
      return [];
    }

    return models.filter((m) => m.name !== model_id && m.name !== "undefined");
  }, [models]);

  const mutation = useMutation({
    mutationFn: () => {
      setIsSaving(true);

      return fetch(`/api/store/${brandId}/models/remodel-allowlist`, {
        method: "POST",
        body: JSON.stringify([
          {
            "from-model": model_id,
            "to-model": targetModel,
            "from-serial": serials === "*" ? null : serials,
            description: description,
          },
        ]),
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": window.CSRF_TOKEN,
        },
      });
    },
    onMutate: async (newRemodel) => {
      await queryClient.cancelQueries({ queryKey: ["remodels"] });
      const previousRemodels = queryClient.getQueryData(["remodels"]);
      queryClient.setQueryData(["remodels"], () => [newRemodel]);
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
      setSerials("");
      setDescription("");

      queryClient.invalidateQueries({ queryKey: ["remodels"] });
      setIsSaving(false);
      navigate(`/admin/${id}/models/${model_id}/remodel`);
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
            <p>
              <Icon name="spinner" className="u-animation--spin" />
              &nbsp;Adding new policy...
            </p>
          )}
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            <Select
              defaultValue=""
              id="target-model"
              label="Select a target model"
              options={[{ label: "Select a model", value: "" }].concat(
                targetModels.map((m) => ({
                  label: m.name,
                  value: m.name,
                })),
              )}
              required
              disabled={!models || models.length < 1}
              onChange={(e) => {
                setTargetModel(e.target.value);
              }}
            />
            <Input
              id="input-devices"
              label="Input devices to target"
              placeholder="Enter serial number"
              type="text"
              onChange={(e) => {
                setSerials(e.target.value);
              }}
              required
            />
            <Input
              id="note"
              label="Note (Max 140 characters)"
              placeholder="Add a note (optional)"
              type="text"
              maxLength={140}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </div>
          <div className="u-fixed-width">
            <hr />
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/models/${model_id}/remodel`}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={!targetModel || !serials}
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
