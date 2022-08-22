import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  Strip,
  Notification,
  Modal,
  Button,
} from "@canonical/react-components";

import { getChanges, getFormData, getListingData } from "../../utils";

import PageHeader from "../PageHeader";
import SaveAndPreview from "../SaveAndPreview";
import ListingDetailsSection from "../../sections/ListingDetailsSection";
import ContactInformationSection from "../../sections/ContactInformationSection";
import AdditionalInformationSection from "../../sections/AdditionalInformationSection";
import PreviewForm from "../PreviewForm";

function App() {
  const snapId = window?.listingData?.snap_id;
  const publisherName = window?.listingData?.publisher_name;
  const categories = window?.listingData?.categories;

  const [listingData, setListingData] = useState(
    getListingData(window?.listingData)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [showMetadataWarningModal, setShowMetadataWarningModal] = useState(
    false
  );
  const [formData, setFormData] = useState({});
  const [updateMetadataOnRelease, setUpdateMetadataOnRelease] = useState(
    listingData?.update_metadata_on_release
  );

  const {
    register,
    getFieldState,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    getValues,
    formState,
  } = useForm({ defaultValues: listingData, mode: "onChange" });

  const isDirty = formState.isDirty;
  const isValid = formState.isValid;
  const dirtyFields: { [key: string]: any } = formState.dirtyFields;

  const onSubmit = (data: any) => {
    if (listingData?.update_metadata_on_release) {
      setShowMetadataWarningModal(true);
      setFormData(data);
    } else {
      submitForm(data);
    }
  };

  const submitForm = (data: any) => {
    const changes = getChanges(dirtyFields, data);
    const formData = getFormData(data, snapId, changes);

    setIsSaving(true);

    fetch(`/${data.snap_name}/listing`, {
      method: "POST",
      body: formData,
    }).then((response) => {
      if (response.status === 200) {
        setTimeout(() => {
          setIsSaving(false);
          setHasSaved(true);
          reset(data);
          window.scrollTo(0, 0);
          setUpdateMetadataOnRelease(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setIsSaving(false);
          setSavedError(true);
        }, 1000);
      }
    });
  };

  useEffect(() => {
    const formFieldSubscription = watch((data: any) => {
      setListingData(data);
      window.localStorage.setItem(data.snap_name, JSON.stringify(data));
    });

    return () => {
      formFieldSubscription.unsubscribe();
    };
  }, [watch]);

  return (
    <>
      <PageHeader snapName={listingData?.snap_name} />

      <Form
        onSubmit={handleSubmit(onSubmit)}
        stacked={true}
        encType="multipart/form-data"
      >
        <SaveAndPreview
          snapName={listingData?.snap_name}
          isDirty={isDirty}
          reset={reset}
          isSaving={isSaving}
          isValid={isValid}
        />

        {updateMetadataOnRelease && (
          <>
            <section className="p-strip is-shallow u-no-padding--bottom">
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
            </section>

            {showMetadataWarningModal ? (
              <Modal
                close={() => {
                  setShowMetadataWarningModal(false);
                }}
                title="Warning"
                buttonRow={
                  <>
                    <Button
                      type="button"
                      className="u-no-margin--bottom"
                      onClick={() => {
                        setShowMetadataWarningModal(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="u-no-margin--bottom u-no-margin--right"
                      appearance="positive"
                      onClick={() => {
                        submitForm(formData);
                        setShowMetadataWarningModal(false);
                      }}
                    >
                      Save changes
                    </Button>
                  </>
                }
              >
                <p>
                  Making these changes means that the snap will no longer use
                  the data from snapcraft.yaml.
                </p>
              </Modal>
            ) : null}
          </>
        )}

        <Strip shallow={true} className="u-no-padding--bottom">
          {hasSaved && (
            <div className="u-fixed-width">
              <Notification
                severity="positive"
                title="Changes applied successfully."
                onDismiss={() => {
                  setHasSaved(false);
                }}
              />
            </div>
          )}

          {savedError && (
            <div className="u-fixed-width">
              <Notification
                severity="negative"
                title="Something went wrong."
                onDismiss={() => {
                  setHasSaved(false);
                  setSavedError(false);
                }}
              />
            </div>
          )}

          <ListingDetailsSection
            register={register}
            getFieldState={getFieldState}
            setValue={setValue}
            categories={categories}
            primaryCategory={listingData?.["primary-category"]}
            secondaryCategory={listingData?.["secondary-category"]}
            iconUrl={listingData?.icon_url}
            bannerUrl={listingData?.banner_url}
            control={control}
            getValues={getValues}
          />
          <Strip shallow={true}>
            <div className="u-fixed-width">
              <hr className="u-no-maring--bottom" />
            </div>
          </Strip>

          <ContactInformationSection
            getFieldState={getFieldState}
            register={register}
            publisherName={publisherName}
            control={control}
          />

          <Strip shallow={true}>
            <div className="u-fixed-width">
              <hr className="u-no-maring--bottom" />
            </div>
          </Strip>

          <AdditionalInformationSection
            register={register}
            listingData={listingData}
            setValue={setValue}
            watch={watch}
          />
        </Strip>
      </Form>
      <PreviewForm listingData={listingData} />
    </>
  );
}

export default App;
