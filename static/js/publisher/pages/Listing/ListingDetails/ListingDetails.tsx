import { useState } from "react";
import type {
  UseFormRegister,
  UseFormGetValues,
  UseFormSetValue,
  FieldValues,
  Control,
  FormState,
} from "react-hook-form";
import { Row, Col, Button, Icon } from "@canonical/react-components";

import ImageUpload from "./ImageUpload";
import Screenshots from "./Screenshots";

import type { ListingData } from "../../../types";

type Props = {
  data: ListingData;
  register: UseFormRegister<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  control: Control<FieldValues>;
  formState: FormState<FieldValues>;
};

function ListingDetails({
  data,
  register,
  getValues,
  setValue,
  control,
  formState,
}: Props): React.JSX.Element {
  const [showSupportedMarkdownSyntax, setShowSupportedMarkdownSyntax] =
    useState<boolean>(false);

  const [hasSecondaryCategory, setHasSecondCategory] = useState<boolean>(
    data.secondary_category ? true : false,
  );

  const showSecondaryCategory = (): boolean => {
    if (getValues("secondary_category") !== "") {
      return true;
    }

    return hasSecondaryCategory;
  };

  return (
    <>
      <h2 className="p-heading--4">Listing details</h2>

      <ImageUpload
        imageUrl={data.icon_url}
        register={register}
        setValue={setValue}
        getValues={getValues}
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
        tourLabel="listing-icon"
        hasDarkThemePreview={true}
        type="icon"
      />

      <Row
        className={`p-form__group ${
          formState.errors.title ? "p-form-validation is-error" : ""
        }`}
        data-tour="listing-title"
      >
        <Col size={2}>
          <label htmlFor="title" className="p-form__label">
            Title: <span aria-label="required">*</span>
          </label>
        </Col>
        <Col size={8}>
          <div className="p-form__control">
            <input
              type="text"
              id="title"
              className="p-form-validation__input"
              defaultValue={data.title}
              aria-describedby={
                formState.errors.title ? "title-error" : undefined
              }
              {...register("title", { required: "This field is required" })}
            />
            {formState.errors.title && (
              <p
                className="p-form-validation__message"
                id="title-error"
                role="alert"
              >
                {typeof formState.errors.title?.message === "string"
                  ? formState.errors.title.message
                  : "This field is required"}
              </p>
            )}
          </div>
        </Col>
      </Row>

      <Row
        className={`p-form__group ${
          formState.errors.primary_category ? "p-form-validation is-error" : ""
        }`}
        data-tour="listing-category"
      >
        <Col size={2}>
          <label htmlFor="primary_category" className="p-form__label">
            Category: <span aria-label="required">*</span>
          </label>
        </Col>
        <Col size={5}>
          <div className="p-form__control">
            <select
              id="primary_category"
              className="p-form-validation__input"
              defaultValue={data.primary_category}
              aria-describedby={
                formState.errors.primary_category
                  ? "primary-category-error"
                  : undefined
              }
              {...register("primary_category", {
                required: "This field is required",
              })}
            >
              <option value="">Select a category</option>
              {data.categories.map((category) => (
                <option
                  value={category.slug}
                  key={category.slug}
                  disabled={category.slug === getValues("secondary_category")}
                >
                  {category.name}
                </option>
              ))}
            </select>
            {formState.errors.primary_category && (
              <p
                className="p-form-validation__message"
                id="primary-category-error"
                role="alert"
              >
                {typeof formState.errors.primary_category?.message === "string"
                  ? formState.errors.primary_category.message
                  : "This field is required"}
              </p>
            )}
          </div>
        </Col>
      </Row>

      {showSecondaryCategory() && (
        <Row
          className={`p-form__group ${
            formState.errors.secondary_category
              ? "p-form-validation is-error"
              : ""
          }`}
        >
          <Col size={2}>
            <label htmlFor="secondary_category" className="p-form__label">
              Secondary category: <span aria-label="required">*</span>
            </label>
          </Col>
          <Col size={5}>
            <div className="p-form__control">
              <select
                id="secondary_category"
                className="p-form-validation__input"
                defaultValue={data.secondary_category || ""}
                aria-describedby={
                  formState.errors.secondary_category
                    ? "secondary-category-error"
                    : undefined
                }
                {...register("secondary_category", {
                  required: showSecondaryCategory()
                    ? "This field is required"
                    : false,
                })}
              >
                <option value="">Select a category</option>
                {data.categories.map((category) => (
                  <option
                    value={category.slug}
                    key={category.slug}
                    disabled={category.slug === getValues("primary_category")}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              {formState.errors.secondary_category && (
                <p
                  className="p-form-validation__message"
                  id="secondary-category-error"
                  role="alert"
                >
                  {typeof formState.errors.secondary_category?.message ===
                  "string"
                    ? formState.errors.secondary_category.message
                    : "This field is required"}
                </p>
              )}
            </div>
          </Col>
          <Col size={2}>
            <Button
              type="button"
              appearance="base"
              onClick={() => {
                setValue("secondary_category", "", {
                  shouldDirty: data.secondary_category !== "",
                });
                setHasSecondCategory(false);
              }}
            >
              <Icon name="delete" />
              <span className="u-off-screen">Remove secondary category</span>
            </Button>
          </Col>
        </Row>
      )}

      {!showSecondaryCategory() && (
        <Row className="p-form__group">
          <Col size={5} emptyLarge={3}>
            <Button
              type="button"
              appearance="link"
              className="u-no-margin--bottom"
              onClick={() => {
                setHasSecondCategory(true);
              }}
            >
              +&nbsp;Add another category
            </Button>
            <p>
              <small className="u-text-muted">
                If your snap fits into multiple categories you can select
                another.
              </small>
            </p>
          </Col>
        </Row>
      )}

      <Row className="p-form__group" data-tour="listing-video">
        <Col size={2}>
          <label htmlFor="video_urls">Video:</label>
        </Col>
        <Col size={8}>
          <div className="p-form__control">
            <input
              type="url"
              id="video_urls"
              defaultValue={data.video_urls}
              {...register("video_urls")}
            />
          </div>
        </Col>
      </Row>

      <Screenshots
        register={register}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />

      <ImageUpload
        imageUrl={data.banner_urls[0]}
        register={register}
        setValue={setValue}
        getValues={getValues}
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
        imageUrlFieldKey="banner_urls"
        imageFieldKey="banner"
        previewWidth={720}
        previewHeight={240}
        fileTypes="image/png, image/jpeg"
        helpText="Adding a featured banner will increase your chances of being featured on snapcraft.io and in GNOME software but does not immediately make you eligible to be featured."
        tourLabel="listing-banner"
        type="banner"
      />

      <Row
        className={`p-form__group ${
          formState.errors.summary ? "p-form-validation is-error" : ""
        }`}
        data-tour="listing-summary"
      >
        <Col size={2}>
          <label htmlFor="summary">
            Summary: <span aria-label="required">*</span>
          </label>
        </Col>
        <Col size={8}>
          <div className="p-form__control">
            <input
              type="text"
              id="summary"
              className="p-form-validation__input"
              defaultValue={data.summary}
              aria-describedby={
                formState.errors.summary ? "summary-error" : undefined
              }
              {...register("summary", { required: "This field is required" })}
            />
            {formState.errors.summary && (
              <p
                className="p-form-validation__message"
                id="summary-error"
                role="alert"
              >
                {typeof formState.errors.summary?.message === "string"
                  ? formState.errors.summary.message
                  : "This field is required"}
              </p>
            )}
          </div>
        </Col>
      </Row>

      <Row
        className={`p-form__group ${
          formState.errors.description ? "p-form-validation is-error" : ""
        }`}
        data-tour="listing-description"
      >
        <Col size={2}>
          <label htmlFor="description">
            Description: <span aria-label="required">*</span>
          </label>
        </Col>
        <Col size={8}>
          <div className="p-form__control">
            <textarea
              id="description"
              className="p-form-validation__input"
              defaultValue={data.description}
              rows={10}
              aria-describedby={
                formState.errors.description ? "description-error" : undefined
              }
              {...register("description", {
                required: "This field is required",
              })}
            />
            {formState.errors.description && (
              <p
                className="p-form-validation__message"
                id="description-error"
                role="alert"
              >
                {typeof formState.errors.description?.message === "string"
                  ? formState.errors.description.message
                  : "This field is required"}
              </p>
            )}
          </div>
          <Button
            appearance="link"
            type="button"
            onClick={() => {
              setShowSupportedMarkdownSyntax(!showSupportedMarkdownSyntax);
            }}
          >
            <small>
              {showSupportedMarkdownSyntax ? "Hide" : "Show"} supported markdown
              syntax
            </small>
          </Button>
          {showSupportedMarkdownSyntax && (
            <Row>
              <Col size={4}>
                <p>
                  <small>
                    <strong>Bold</strong>: <code>**Foo**</code>
                  </small>
                </p>
                <p>
                  <small>
                    <strong>URLs</strong>: <code>https://foo.bar</code>
                  </small>
                </p>
                <p>
                  <small>
                    <strong>Lists</strong>: <code>* Foo</code>
                  </small>
                </p>
              </Col>
              <Col size={4}>
                <p>
                  <small>
                    <strong>Italics</strong>: <code>_Foo_</code>
                  </small>
                </p>
                <p>
                  <small>
                    <strong>Code</strong>: Text indented with 3 spaces or inside
                    single backticks
                  </small>
                  <code>`code`</code>
                </p>
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </>
  );
}

export default ListingDetails;
