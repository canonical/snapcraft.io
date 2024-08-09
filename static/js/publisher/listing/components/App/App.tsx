import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Strip, Notification } from "@canonical/react-components";

import {
  getChanges,
  getFormData,
  getListingData,
  shouldShowUpdateMetadataWarning,
  getDefaultValues,
} from "../../utils";
import { initListingTour } from "../../../tour";

import PageHeader from "../../../shared/PageHeader";
import SaveAndPreview from "../../../shared/SaveAndPreview";
import UpdateMetadataModal from "../../../shared/UpdateMetadataModal";
import SaveStateNotifications from "../../../shared/SaveStateNotifications";
import ListingDetailsSection from "../../sections/ListingDetailsSection";
import ContactInformationSection from "../../sections/ContactInformationSection";
import AdditionalInformationSection from "../../sections/AdditionalInformationSection";
import PreviewForm from "../PreviewForm";

function App() {
  const snapData = getListingData(window?.listingData);
  const snapId = window?.listingData?.snap_id;
  const snapTitle = window?.listingData?.snap_title;
  const snapName = window?.listingData?.snap_name;
  const publisherName = window?.listingData?.publisher_name;
  const categories = window?.listingData?.categories;
  const tourSteps = window?.tourSteps;

  const defaultValues = getDefaultValues(snapData);

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedError, setSavedError] = useState<
    boolean | { code: string; message: string }[]
  >(false);
  const [showMetadataWarningModal, setShowMetadataWarningModal] =
    useState(false);
  const [formData, setFormData] = useState({});
  const [updateMetadataOnRelease, setUpdateMetadataOnRelease] = useState(
    snapData.update_metadata_on_release
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
  } = useForm({ defaultValues, mode: "onChange" });

  const isDirty = formState.isDirty;
  const isValid = formState.isValid;
  const dirtyFields: { [key: string]: any } = formState.dirtyFields;

  const onSubmit = (data: any) => {
    if (
      snapData.update_metadata_on_release &&
      shouldShowUpdateMetadataWarning(dirtyFields)
    ) {
      setShowMetadataWarningModal(true);
      setFormData(data);
    } else {
      submitForm(data);
    }
  };

  const submitForm = async (data: any) => {
    const changes = getChanges(dirtyFields, data);
    const formData = getFormData(data, snapId, changes);

    const previousDirtyFields = Object.assign({}, dirtyFields);

    setHasSaved(false);
    setIsSaving(true);
    setSavedError(false);

    const response = await fetch(`/${snapName}/listing.json`, {
      method: "POST",
      body: formData,
    });

    if (shouldShowUpdateMetadataWarning(previousDirtyFields)) {
      setUpdateMetadataOnRelease(false);
    }

    if (response.status !== 200) {
      setTimeout(() => {
        setIsSaving(false);
        setSavedError(true);
      }, 1000);
      return;
    }

    const jsonData = await response.json();
    if (jsonData.error_list) {
      setTimeout(() => {
        setIsSaving(false);
        setSavedError(jsonData.error_list);
      }, 1000);
      return;
    }
    setTimeout(() => {
      setIsSaving(false);
      setHasSaved(true);
      reset(data);
      window.scrollTo(0, 0);
    }, 1000);
  };

  useEffect(() => {
    const tourContainer = document.getElementById(
      "tour-container"
    ) as HTMLElement;
    initListingTour({
      snapName,
      container: tourContainer,
      formFields: snapData,
      steps: tourSteps,
    });
  }, []);

  return (
    <>
      <PageHeader
        snapName={snapName}
        snapTitle={snapTitle}
        publisherName={publisherName}
        activeTab="listing"
      />

      <Form
        onSubmit={handleSubmit(onSubmit)}
        stacked={true}
        encType="multipart/form-data"
      >
        <SaveAndPreview
          snapName={snapName}
          isDirty={isDirty}
          reset={reset}
          isSaving={isSaving}
          isValid={isValid}
          showPreview={true}
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
              <UpdateMetadataModal
                setShowMetadataWarningModal={setShowMetadataWarningModal}
                submitForm={submitForm}
                formData={formData}
              />
            ) : null}
          </>
        )}

        <Strip shallow={true} className="u-no-padding--bottom">
          <SaveStateNotifications
            hasSaved={hasSaved}
            setHasSaved={setHasSaved}
            savedError={savedError}
            setSavedError={setSavedError}
          />

          <ListingDetailsSection
            register={register}
            getFieldState={getFieldState}
            setValue={setValue}
            categories={categories}
            primaryCategory={snapData["primary-category"]}
            secondaryCategory={snapData["secondary-category"]}
            iconUrl={snapData.icon_url}
            bannerUrl={snapData.banner_url}
            control={control}
            getValues={getValues}
          />
          <Strip shallow={true}>
            <div className="u-fixed-width">
              <hr className="u-no-maring--bottom" />
            </div>
          </Strip>

          <ContactInformationSection
            snapName={snapName}
            getFieldState={getFieldState}
            register={register}
            publisherName={publisherName}
            control={control}
            getValues={getValues}
            formState={formState}
          />

          <Strip shallow={true}>
            <div className="u-fixed-width">
              <hr className="u-no-maring--bottom" />
            </div>
          </Strip>

          <AdditionalInformationSection
            register={register}
            listingData={snapData}
            setValue={setValue}
            watch={watch}
            getValues={getValues}
          />
        </Strip>
      </Form>
      <PreviewForm snapName={snapName} getValues={getValues} />

      <div id="tour-container" />
    </>
  );
}

export default App;
