import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Strip, Notification } from "@canonical/react-components";

import PageHeader from "../PageHeader";
import SaveAndPreview from "../SaveAndPreview";
import ListingFormInput from "../ListingFormInput";
import ListingDescriptionField from "../ListingDescriptionField";
import PreviewForm from "../PreviewForm";

interface DirtyFields {
  [key: string]: string;
}

function App() {
  const snapId = window?.listingData?.snap_id;
  const publisherName = window?.listingData?.publisher_name;
  const [listingData, setListingData] = useState({
    snap_name: window?.listingData?.snap_name,
    title: window?.listingData?.snap_title,
    summary: window?.listingData?.summary,
    description: window?.listingData?.description,
    website: window?.listingData?.website,
    contact: window?.listingData?.contact,
    categories: window?.listingData?.categories,
    images: [],
    public_metrics_enabled: window?.listingData?.public_metrics_enabled,
    public_metrics_blacklist: window?.listingData?.public_metrics_blacklist,
    license: window?.listingData?.license,
    video_urls: window?.listingData?.video_urls[0],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedError, setSavedError] = useState(false);

  const {
    register,
    getFieldState,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, dirtyFields, isValid },
  } = useForm({ defaultValues: listingData, mode: "onChange" });

  const onSubmit = (data: any) => {
    const changes: DirtyFields = {};
    const keys = Object.keys(dirtyFields);

    keys.forEach((key) => {
      changes[key] = data[key];
    });

    const formData = new FormData();

    formData.set("csrf_token", window.CSRF_TOKEN);
    formData.set("snap_id", snapId);
    formData.set("title", data?.title);
    formData.set("summary", data?.summary);
    formData.set("description", data?.description);
    formData.set("video_urls", data?.video_urls);
    formData.set("website", data?.website);
    formData.set("contact", data?.contact);
    formData.set("changes", JSON.stringify(changes));

    setIsSaving(true);

    fetch(`/${data.snap_name}/listing`, {
      method: "POST",
      body: formData,
    }).then((response) => {
      console.log("response", response);
      if (response.status === 200) {
        setTimeout(() => {
          setIsSaving(false);
          setHasSaved(true);
          reset(data);
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
      <Form onSubmit={handleSubmit(onSubmit)} stacked={true}>
        <SaveAndPreview
          snapName={listingData?.snap_name}
          isDirty={isDirty}
          reset={reset}
          isSaving={isSaving}
          isValid={isValid}
        />

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

          <div className="u-fixed-width">
            <h2 className="p-heading--4">Listing details</h2>
          </div>

          <ListingFormInput
            label="Title"
            name="title"
            maxLength={40}
            register={register}
            required={true}
            getFieldState={getFieldState}
          />

          <ListingFormInput
            type="url"
            label="Video"
            name="video_urls"
            register={register}
            helpText="Vimeo, YouTube or asciinema URL"
            getFieldState={getFieldState}
            pattern={/^https?:\/\//gi}
          />

          <ListingFormInput
            label="Summary"
            name="summary"
            maxLength={128}
            register={register}
            required={true}
            getFieldState={getFieldState}
          />

          <ListingDescriptionField
            register={register}
            getFieldState={getFieldState}
          />
        </Strip>

        <Strip shallow={true}>
          <div className="u-fixed-width">
            <hr className="u-no-maring--bottom" />
          </div>
        </Strip>

        <div className="u-fixed-width">
          <h2 className="p-heading--4">Contact information</h2>
        </div>

        <ListingFormInput
          type="url"
          label="Developer website"
          name="website"
          register={register}
          placeholder="https://snapcraft.io"
          helpText="Please include a valid http:// or https:// link"
          getFieldState={getFieldState}
          pattern={
            /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/
          }
        />

        <ListingFormInput
          type="text"
          label={`Contact ${publisherName}`}
          name="contact"
          register={register}
          placeholder="mailto:example@example.com"
          helpText="An http: or https: link, or an e-mail address"
          getFieldState={getFieldState}
          pattern={
            /(^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$)|(^mailto:)?([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$)/
          }
        />
      </Form>
      <PreviewForm listingData={listingData} />
    </>
  );
}

export default App;
