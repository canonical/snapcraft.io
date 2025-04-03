import { useState } from "react";
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

import type { ListingData } from "../../../types";

type Props = {
  data: ListingData;
  refetch: () => void;
};

function ListingForm({ data, refetch }: Props): React.JSX.Element {
  const { snapId } = useParams();

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
    defaultValues: getDefaultListingData(data),
  });

  const { dirtyFields } = useFormState({ control });

  const [showSuccessNotification, setShowSuccessNotification] =
    useState<boolean>(false);

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
    setShowSuccessNotification,
    setUpdateMetadataOnRelease,
    shouldShowUpdateMetadataWarning,
    snapName: snapId,
  });

  return (
    <>
      <form
        className="p-form"
        // @ts-expect-error Conflict between React Query and Reach Hook Form
        onSubmit={handleSubmit((values: ListingData) => {
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
          isDirty={formState.isDirty}
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
                    href="/docs/snapcraft-top-level-metadata"
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

        {showSuccessNotification && (
          <Strip shallow className="u-no-padding--bottom">
            <Notification
              severity="positive"
              onDismiss={() => {
                setShowSuccessNotification(false);
              }}
              className="u-no-margin--bottom"
            >
              Changes applied successfully.
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
            getValues={getValues}
            setValue={setValue}
            watch={watch}
          />
        </Strip>
      </form>
      {snapId && (
        <PreviewForm
          snapName={snapId}
          getValues={getValues}
          watch={watch}
          data={data}
        />
      )}
    </>
  );
}

export default ListingForm;
