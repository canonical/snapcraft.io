import React from "react";

import ListingFormInput from "../../components/ListingFormInput";
import ListingDescriptionField from "../../components/ListingDescriptionField";
import CategoriesInput from "../../components/CategoriesInput";
import ImageUpload from "../../components/ImageUpload";
import Screenshots from "../../components/Screenshots";

type Props = {
  register: Function;
  getFieldState: Function;
  setValue: Function;
  primaryCategory: string;
  secondaryCategory: string;
  categories: Array<{
    slug: string;
    name: string;
  }>;
  iconUrl: string;
  bannerUrl: string;
  control: any;
  getValues: Function;
};

function ListingDetailsSection({
  register,
  getFieldState,
  setValue,
  categories,
  primaryCategory,
  secondaryCategory,
  iconUrl,
  bannerUrl,
  control,
  getValues,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Listing details</h2>
      </div>

      <ImageUpload
        imageUrl={iconUrl}
        register={register}
        setValue={setValue}
        validationSchema={{
          maxFileSize: 256000,
          minWidth: 40,
          maxWidth: 512,
          minHeight: 40,
          maxHeight: 512,
          fileTypes: "PNG, JPEG & SVG",
          aspectRatio: {
            width: 1,
            height: 1,
          },
        }}
        label="Snap icon"
        imageUrlFieldKey="icon_url"
        imageFieldKey="icon"
        previewWidth={120}
        previewHeight={120}
        fileTypes="image/png, image/jpeg, image/svg+xml"
      />

      <ListingFormInput
        label="Title"
        name="title"
        maxLength={40}
        register={register}
        required={true}
        getFieldState={getFieldState}
      />

      <CategoriesInput
        categories={categories}
        register={register}
        getFieldState={getFieldState}
        primaryCategory={primaryCategory}
        secondaryCategory={secondaryCategory}
        setValue={setValue}
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

      <Screenshots
        register={register}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />

      <ImageUpload
        imageUrl={bannerUrl}
        register={register}
        setValue={setValue}
        validationSchema={{
          maxFileSize: 2000000,
          minWidth: 720,
          maxWidth: 4320,
          minHeight: 240,
          maxHeight: 1440,
          fileTypes: "JPEG & PNG files",
          aspectRatio: {
            width: 3,
            height: 1,
          },
        }}
        label="Featured banner"
        imageUrlFieldKey="banner_url"
        imageFieldKey="banner"
        previewWidth={720}
        previewHeight={240}
        fileTypes="image/png, image/jpeg"
        helpText="Adding a featured banner will increase your chances of being featured on snapcraft.io and in GNOME software but does not immediately make you eligible to be featured."
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
    </>
  );
}

export default ListingDetailsSection;
