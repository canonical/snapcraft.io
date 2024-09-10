import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Form, Strip, Notification } from "@canonical/react-components";

import {
  getListingChanges,
  getListingFormData,
  getListingData,
  shouldShowUpdateMetadataWarning,
  getDefaultValues,
} from "../../utils";
import { initListingTour } from "../../../publisher/tour";

import SectionNav from "../../components/SectionNav";
import SaveAndPreview from "../../components/SaveAndPreview";
import UpdateMetadataModal from "../../components/UpdateMetadataModal";
import SaveStateNotifications from "../../components/SaveStateNotifications";
import ListingDetailsSection from "./sections/ListingDetailsSection";
import ContactInformationSection from "./sections/ContactInformationSection";
import AdditionalInformationSection from "./sections/AdditionalInformationSection";
import PreviewForm from "./PreviewForm";

function Listing() {
  const { snapId } = useParams();
  const snapData = getListingData(window.SNAP_LISTING_DATA);
  const snapTitle = window.SNAP_LISTING_DATA.snap_title;
  const snapName = window.SNAP_LISTING_DATA.snap_name;
  const publisherName = window.SNAP_LISTING_DATA.publisher_name;
  const categories = window.SNAP_LISTING_DATA.categories;
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
    const changes = getListingChanges(dirtyFields, data);
    const formData = getListingFormData(data, snapId, changes);

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
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Listing
      </h1>

      <SectionNav snapName={snapId} activeTab="listing" />

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

export default Listing;
