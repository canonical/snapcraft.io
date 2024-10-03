import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm, useFormState, FieldValues } from "react-hook-form";
import { Strip, Notification } from "@canonical/react-components";

import SaveAndPreview from "../../../components/SaveAndPreview";
import ListingDetails from "../ListingDetails";
import ContactInformation from "../ContactInformation";
import AdditionalInformation from "../AdditionalInformation";
import PreviewForm from "../PreviewForm";
import UpdateMetadataModal from "../../../components/UpdateMetadataModal";

import {
  shouldShowUpdateMetadataWarning,
  getDefaultListingData,
} from "../../../utils";
import { initListingTour } from "../../../../publisher/tour";

import { useMutateListingData } from "../../../hooks";

import type { ListingData } from "../../../types";

type Props = {
  data: ListingData;
  refetch: Function;
};

function ListingForm({ data, refetch }: Props): JSX.Element {
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

  const [formValues, setFormValues] = useState<{ [key: string]: any } | null>(
    null
  );

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

  useEffect(() => {
    const tourContainer = document.getElementById(
      "tour-container"
    ) as HTMLElement;

    if (snapId) {
      initListingTour({
        snapName: snapId,
        container: tourContainer,
        formFields: {
          title: data.title,
          snap_name: snapId,
          categories: [],
          video_urls: [],
          images: [],
          summary: data.summary,
          website: [],
          contact: [],
        },
        steps: data.tour_steps,
      });
    }
  }, []);

  return (
    <>
      <form
        className="p-form"
        onSubmit={handleSubmit((values: any) => {
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
      {snapId && <PreviewForm snapName={snapId} getValues={getValues} />}
      <div id="tour-container" />
    </>
  );
}

export default ListingForm;
