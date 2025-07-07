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

import type { ListingData, StatusNotification } from "../../../types";

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
      {snapId && <PreviewForm snapName={snapId} watch={watch} data={data} />}
    </>
  );
}

export default ListingForm;
