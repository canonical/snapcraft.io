import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, Strip, Notification } from "@canonical/react-components";

import PageHeader from "../PageHeader";
import SaveAndPreview from "../SaveAndPreview";
import ListingDetailsSection from "../../sections/ListingDetailsSection";
import ContactInformationSection from "../../sections/ContactInformationSection";
import AdditionalInformationSection from "../../sections/AdditionalInformationSection";
import PreviewForm from "../PreviewForm";

interface DirtyFields {
  [key: string]: string | Array<string> | boolean;
}

type License = {
  key: string;
  name: string;
};

function App() {
  const snapId = window?.listingData?.snap_id;
  const publisherName = window?.listingData?.publisher_name;
  const categories = window?.listingData?.categories;

  const licenseSort = (a: License, b: License) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  };

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
    license_type: window?.listingData?.license_type,
    licenses: window?.listingData?.licenses.sort(licenseSort),
    video_urls: window?.listingData?.video_urls[0],
    "primary-category": window?.listingData?.snap_categories?.categories[0],
    "secondary-category": window?.listingData?.snap_categories?.categories[1],
    public_metrics_territories: !window?.listingData?.public_metrics_blacklist.includes(
      "installed_base_by_country_percent"
    ),
    public_metrics_distros: !window?.listingData?.public_metrics_blacklist.includes(
      "weekly_installed_base_by_operating_system_normalized"
    ),
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
    setValue,
    formState: { isDirty, dirtyFields, isValid },
  } = useForm({ defaultValues: listingData, mode: "onChange" });

  const onSubmit = (data: any) => {
    const changes: DirtyFields = {};
    const keys = Object.keys(dirtyFields);

    keys.forEach((key) => {
      if (key !== "primary-category" && key !== "secondary-category") {
        changes[key] = data[key];
      }

      if (
        dirtyFields["primary-category"] ||
        dirtyFields["secondary-category"]
      ) {
        changes.categories = [];

        if (data["primary-category"]) {
          changes.categories.push(data["primary-category"]);
        }

        if (data["secondary-category"]) {
          changes.categories.push(data["secondary-category"]);
        }
      }
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
    formData.set("primary-category", data?.["primary-category"]);
    formData.set("secondary-category", data?.["secondary-category"]);
    formData.set("public_metrics_enabled", data?.public_metrics_enabled);
    formData.set("public_metrics_blacklist", data?.public_metrics_blacklist);
    formData.set("license", data?.license || "unset");
    formData.set("changes", JSON.stringify(changes));

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

          <ListingDetailsSection
            register={register}
            getFieldState={getFieldState}
            setValue={setValue}
            categories={categories}
            primaryCategory={listingData?.["primary-category"]}
            secondaryCategory={listingData?.["secondary-category"]}
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
