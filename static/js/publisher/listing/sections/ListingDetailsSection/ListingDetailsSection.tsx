import React from "react";

import ListingFormInput from "../../components/ListingFormInput";
import ListingDescriptionField from "../../components/ListingDescriptionField";
import CategoriesInput from "../../components/CategoriesInput";
import SnapIcon from "../../components/SnapIcon";

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
};

function ListingDetailsSection({
  register,
  getFieldState,
  setValue,
  categories,
  primaryCategory,
  secondaryCategory,
  iconUrl,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Listing details</h2>
      </div>

      <SnapIcon iconUrl={iconUrl} register={register} setValue={setValue} />

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
