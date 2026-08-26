import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm, useFormState, FieldValues } from "react-hook-form";
import { Strip, Notification } from "@canonical/react-components";

import SaveAndPreview from "../../../components/SaveAndPreview";
import ListingDetails from "../ListingDetails";
import ContactInformation from "../ContactInformation";
import AdditionalInformation from "../AdditionalInformation";
import PreviewForm from "../PreviewForm";
import UpdateMetadataModal from "../../../components/UpdateMetadataModal";
import Tour from "../../../components/Tour";

import {
  shouldShowUpdateMetadataWarning,
  getDefaultListingData,
  listingTourSteps,
} from "../../../utils";

import { useMutateListingData } from "../../../hooks";

import type { ListingData, StatusNotification } from "../../../types";

type Props = {
  data: ListingData;
  refetch: () => void;
};

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function isEmptyFileList(value: unknown): value is FileList {
  return (
    typeof FileList !== "undefined" &&
    value instanceof FileList &&
    value.length === 0
  );
}

function getComparableListingValues(values: FieldValues): FieldValues {
  const comparableValues = { ...values };

  if (!comparableValues.public_metrics_enabled) {
    comparableValues.public_metrics_distros = false;
    comparableValues.public_metrics_territories = false;
  }

  Object.entries(comparableValues).forEach(([key, value]) => {
    if (isEmptyFileList(value)) {
      delete comparableValues[key];
    }
  });

  return comparableValues;
}

function areFieldValuesEqual(value: unknown, defaultValue: unknown): boolean {
  if (Object.is(value, defaultValue)) {
    return true;
  }

  if (isFile(value) && isFile(defaultValue)) {
    return (
      value.name === defaultValue.name &&
      value.size === defaultValue.size &&
      value.type === defaultValue.type &&
      value.lastModified === defaultValue.lastModified
    );
  }

  if (Array.isArray(value) && value.length === 1) {
    return areFieldValuesEqual(value[0], defaultValue);
  }

  if (Array.isArray(defaultValue) && defaultValue.length === 1) {
    return areFieldValuesEqual(value, defaultValue[0]);
  }

  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return (
      value.length === defaultValue.length &&
      value.every((item, index) =>
        areFieldValuesEqual(item, defaultValue[index]),
      )
    );
  }

  if (
    value &&
    defaultValue &&
    typeof value === "object" &&
    typeof defaultValue === "object"
  ) {
    const keys = new Set([...Object.keys(value), ...Object.keys(defaultValue)]);

    return [...keys].every((key) =>
      areFieldValuesEqual(
        (value as Record<string, unknown>)[key],
        (defaultValue as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}

function ListingForm({ data, refetch }: Props): React.JSX.Element {
  const { snapId } = useParams();
  const defaultValues = useMemo(() => getDefaultListingData(data), [data]);
  const [savedValues, setSavedValues] = useState<FieldValues>(defaultValues);

  const {
    register,
    reset,
    formState,
    getValues,
    setValue,
    control,
    getFieldState,
    handleSubmit,
    watch,
  } = useForm<FieldValues>({
    defaultValues,
  });

  const { dirtyFields } = useFormState({ control });
  const currentValues = watch();
  const isDirty = !areFieldValuesEqual(
    getComparableListingValues(currentValues),
    getComparableListingValues(savedValues),
  );

  const [notificationStrip, setNotificationStrip] =
    useState<StatusNotification>({});

  const [updateMetadataOnRelease, setUpdateMetadataOnRelease] =
    useState<boolean>(data.update_metadata_on_release);

  const [showMetadataWarningModal, setShowMetadataWarningModal] =
    useState<boolean>(false);

  const [formValues, setFormValues] = useState<{
    [key: string]: unknown;
  } | null>(null);

  const { mutate, isLoading } = useMutateListingData({
    data,
    dirtyFields,
    getDefaultData: getDefaultListingData,
    refetch,
    reset,
    onSaveSuccess: setSavedValues,
    setStatusNotification: setNotificationStrip,
    setUpdateMetadataOnRelease,
    shouldShowUpdateMetadataWarning,
    snapName: snapId,
  });

  let notificationStripContent: string | JSX.Element | undefined;
  if (notificationStrip.message) {
    if (typeof notificationStrip.message === "string") {
      notificationStripContent = notificationStrip.message;
    } else {
      notificationStripContent = (
        <ul>
          {notificationStrip.message.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      );
    }
  }

  return (
    <>
      <form
        className="p-form"
        onSubmit={handleSubmit((values: FieldValues) => {
          if (
            data.update_metadata_on_release &&
            shouldShowUpdateMetadataWarning(dirtyFields)
          ) {
            setFormValues(values);
            setShowMetadataWarningModal(true);
          } else {
            mutate(values);
          }
        })}
      >
        <Tour steps={listingTourSteps} />
        <SaveAndPreview
          snapName={snapId || ""}
          isDirty={isDirty}
          reset={reset}
          isSaving={isLoading}
          isValid={formState.isValid}
          showPreview={true}
        />

        {updateMetadataOnRelease && (
          <>
            <Strip shallow className="u-no-padding--bottom">
              <div className="u-fixed-width">
                <Notification severity="caution">
                  Information here was automatically updated to the latest
                  version of the snapcraft.yaml released to the stable channel.{" "}
                  <a
                    className="p-link--external"
                    href="https://documentation.ubuntu.com/snapcraft/stable/reference/project-file/snapcraft-yaml"
                  >
                    Learn more
                  </a>
                  .
                </Notification>
              </div>
            </Strip>

            {showMetadataWarningModal ? (
              <UpdateMetadataModal
                setShowMetadataWarningModal={setShowMetadataWarningModal}
                submitForm={mutate}
                // @ts-expect-error Conflict between React Query and React Hook Form
                formData={formValues}
              />
            ) : null}
          </>
        )}

        {notificationStrip.message !== undefined && (
          <Strip shallow className="u-no-padding--bottom">
            <Notification
              severity={notificationStrip.success ? "positive" : "negative"}
              onDismiss={() => {
                setNotificationStrip({ message: undefined });
              }}
              className="u-no-margin--bottom"
            >
              {notificationStripContent}
            </Notification>
          </Strip>
        )}

        <Strip shallow>
          <ListingDetails
            data={data}
            register={register}
            getValues={getValues}
            setValue={setValue}
            control={control}
            formState={formState}
          />

          <Strip shallow>
            <div className="u-fixed-width">
              <hr className="u-no-margin--bottom" />
            </div>
          </Strip>

          <ContactInformation
            data={data}
            register={register}
            control={control}
            getFieldState={getFieldState}
            getValues={getValues}
          />

          <Strip shallow>
            <div className="u-fixed-width">
              <hr className="u-no-margin--bottom" />
            </div>
          </Strip>

          <AdditionalInformation
            data={data}
            register={register}
            setValue={setValue}
            watch={watch}
          />
        </Strip>
      </form>
      {snapId && <PreviewForm snapName={snapId} watch={watch} data={data} />}
    </>
  );
}

export default ListingForm;
