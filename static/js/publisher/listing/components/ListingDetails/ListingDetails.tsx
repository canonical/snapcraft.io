import { useState } from "react";
import {
  UseFormRegister,
  UseFormGetValues,
  UseFormSetValue,
  FieldValues,
  Control,
} from "react-hook-form";
import { Row, Col, Button, Icon } from "@canonical/react-components";

import ImageUpload from "./ImageUpload";
import Screenshots from "./Screenshots";

import type { Data } from "../../types";

type Props = {
  data: Data;
  register: UseFormRegister<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  control: Control<FieldValues>;
};

function ListingDetails({
  data,
  register,
  getValues,
  setValue,
  control,
}: Props): JSX.Element {
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
      />

      <Row className="p-form__group">
        <Col size={2} data-tour="listing-title">
          <label htmlFor="title" className="p-form__label">
            Title:
          </label>
        </Col>
        <Col size={8}>
          <div className="p-form__control" data-tour="listing-title">
            <input
              type="text"
              id="title"
              defaultValue={data.title}
              {...register("title", { required: true })}
            />
          </div>
        </Col>
      </Row>

      <Row className="p-form__group">
        <Col size={2} data-tour="listing-category">
          <label htmlFor="primary_category" className="p-form__label">
            Category:
          </label>
        </Col>
        <Col size={5}>
          <div className="p-form__control" data-tour="listing-category">
            <select
              id="primary_category"
              defaultValue={data.primary_category}
              {...register("primary_category", { required: true })}
            >
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
          </div>
        </Col>
      </Row>

      {showSecondaryCategory() && (
        <Row className="p-form__group">
          <Col size={2}>
            <label htmlFor="secondary_category" className="p-form__label">
              Secondary category:
            </label>
          </Col>
          <Col size={5}>
            <div className="p-form__control">
              <select
                id="secondary_category"
                defaultValue={data.secondary_category || ""}
                {...register("secondary_category", { required: true })}
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
          <div className="p-form__control" data-tour="listing-video">
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
      />

      <Row className="p-form__group">
        <Col size={2} data-tour="listing-summary">
          <label htmlFor="video_urls">Summary:</label>
        </Col>
        <Col size={8}>
          <div className="p-form__control" data-tour="listing-summary">
            <input
              type="text"
              id="summary"
              defaultValue={data.summary}
              {...register("summary", { required: true })}
            />
          </div>
        </Col>
      </Row>

      <Row className="p-form__group" data-tour="listing-description">
        <Col size={2}>
          <label htmlFor="video_urls">Description:</label>
        </Col>
        <Col size={8}>
          <div className="p-form__control">
            <textarea
              data-tour="listing-description"
              id="description"
              defaultValue={data.description}
              rows={10}
              {...register("description", { required: true })}
            />
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
                    <strong>Code</strong>: Text indented with 3 spaces of{" "}
                  </small>
                  <code>`</code> inside
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
