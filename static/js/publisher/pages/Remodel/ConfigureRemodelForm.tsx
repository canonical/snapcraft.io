import { useMemo, useState, Dispatch, SetStateAction } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "react-query";
import { useAtomValue } from "jotai";
import { Button, Icon } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm, type FieldValues } from "react-hook-form";

import RouterLinkButton from "../../components/RouterLinkButton";
import { useModels } from "../../hooks";
import useLatestRef from "../../hooks/useLatestRef";
import useRevalidateField from "../../hooks/useRevalidateField";
import { brandIdState } from "../../state/brandStoreState";
import { remodelsListState } from "../../state/remodelsState";

import { setPageTitle } from "../../utils";

type Props = {
  setShowNotification: Dispatch<SetStateAction<boolean>>;
  setNotificationMessage: Dispatch<SetStateAction<string>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
  refetch: () => void;
  setErrorMessage: Dispatch<SetStateAction<string>>;
};

const CONFLICT_MESSAGE =
  "There is an existing remodel with this configuration. Choose another target model or a different device to target.";

function ConfigureRemodelForm({
  refetch,
  setShowNotification,
  setNotificationMessage,
  setShowErrorNotification,
  setErrorMessage,
}: Props): React.JSX.Element {
  const { id, modelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const methods = useForm<FieldValues>({
    defaultValues: {
      targetModel: "",
      serial: "",
      description: "",
      serials: "single",
    },
    mode: "onChange",
  });
  const targetModel = methods.watch("targetModel");
  const serial = methods.watch("serial") || "";
  const description = methods.watch("description");
  const selectAllSerials = methods.watch("serials") === "all";

  const resetFields = () => {
    // Keep the mounted Choices field registered and preserve its selected mode.
    methods.resetField("targetModel");
    methods.resetField("serial");
    methods.resetField("description");
  };

  const handleError = () => {
    setShowErrorNotification(true);
    navigate(`/admin/${id}/models/${modelId}/remodel`);
    resetFields();
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
  const isTargetModelDisabled = targetModels.length === 0;
  // Field memoizes input props; remount updated options without losing selection.
  const targetModelFieldKey = JSON.stringify([
    isTargetModelDisabled,
    ...targetModels.map((model) => model.name),
  ]);

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
  const conflict = hasConflict();
  const conflictRef = useLatestRef(conflict);
  const { trigger, clearErrors } = methods;

  useRevalidateField(trigger, clearErrors, "targetModel", targetModel, [
    conflict,
  ]);

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
        setNotificationMessage("New remodel configured");
        setShowNotification(true);
        refetch();
      }

      resetFields();

      queryClient.invalidateQueries({ queryKey: ["remodels"] });
      setIsSaving(false);
      navigate(`/admin/${id}/models/${modelId}/remodel`);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
  });

  return (
    <div className="p-panel">
      <div className="p-panel__header">
        <h4 className="p-panel__title p-muted-heading">Configure a remodel</h4>
      </div>
      <div className="p-panel__content">
        <div className="u-fixed-width">
          <Form
            methods={methods}
            onSubmit={() => {
              mutation.mutate();
            }}
          >
            {isSaving && (
              <p>
                <Icon icon="spinner" className="u-animation--spin" />
                &nbsp;Configuring remodel...
              </p>
            )}
            <Field
              key={targetModelFieldKey}
              inputType="select"
              name="targetModel"
              id="target-model"
              label="Select a target model"
              options={[{ label: "Select a model", value: "" }].concat(
                targetModels.map((m) => ({
                  label: m.name,
                  value: m.name,
                })),
              )}
              disabled={isTargetModelDisabled}
              unregisterOnUnmount={false}
              registerProps={{
                validate: () => !conflictRef.current || CONFLICT_MESSAGE,
              }}
            />
            <Field
              inputType="choices"
              name="serials"
              label="Input devices to target"
              options={[
                { label: "Enter serial", value: "single" },
                { label: "All serials", value: "all" },
              ]}
            />
            {!selectAllSerials && (
              <Field
                inputType="text"
                name="serial"
                id="input-devices"
                label="Serial number"
                placeholder="Enter serial number"
              />
            )}
            <Field
              inputType="text"
              name="description"
              id="note"
              label="Note (Max 140 characters)"
              placeholder="Add a note (optional)"
              maxLength={140}
              isOptional
            />
            <div>
              <hr className="pragma-hr" />
              <div className="u-align--right">
                <RouterLinkButton
                  importance="secondary"
                  to={`/admin/${id}/models/${modelId}/remodel`}
                >
                  Cancel
                </RouterLinkButton>
                <Button
                  type="submit"
                  importance="primary"
                  anticipation="constructive"
                  style={{ marginLeft: "1rem" }}
                  disabled={isDisabled() || conflict}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default ConfigureRemodelForm;
