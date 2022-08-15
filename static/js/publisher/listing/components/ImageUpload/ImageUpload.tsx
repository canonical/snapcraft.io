import React, { useState, SyntheticEvent } from "react";
import { nanoid } from "nanoid";
import { Row, Col, Notification } from "@canonical/react-components";

import {
  validateImageDimensions,
  validateAspectRatio,
  formatFileSize,
} from "../../utils";

type Props = {
  imageUrl: string | null;
  register: Function;
  setValue: Function;
  validationSchema: {
    maxFileSize: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    fileTypes: string;
    aspectRatio: {
      width: number;
      height: number;
    };
  };
  label: string;
  imageUrlFieldKey: string;
  imageFieldKey: string;
  previewWidth: number;
  previewHeight: number;
  helpText?: string;
  fileTypes: string;
};

function ImageUpload({
  imageUrl,
  register,
  setValue,
  validationSchema,
  label,
  imageUrlFieldKey,
  imageFieldKey,
  previewWidth,
  previewHeight,
  helpText,
  fileTypes,
}: Props) {
  const [showImageRestrictions, setShowImageRestrictions] = useState(false);
  const [imageVaidationError, setImageValidationError] = useState("");
  const [imageIsValid, setImageIsValid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fieldId = nanoid();

  const setImage = (image: File) => {
    if (image.size > validationSchema?.maxFileSize) {
      setImageIsValid(false);
      setImageValidationError(
        `${image.name} file size is over ${
          validationSchema?.maxFileSize / 1000
        }KB`
      );
      return;
    }

    const renderedImage = new Image();
    const renderedImageUrl = URL.createObjectURL(image);

    renderedImage.src = renderedImageUrl;
    renderedImage.onload = () => {
      if (
        !validateAspectRatio(renderedImage.width, renderedImage.height, {
          width: 3,
          height: 1,
        })
      ) {
        setImageIsValid(false);
        setImageValidationError(
          `${image.name} (${renderedImage.width} x ${renderedImage.height} pixels) does not have the correct aspect ratio: it needs to be ${validationSchema?.aspectRatio?.width}:${validationSchema?.aspectRatio?.height} (e.g. ${validationSchema?.minWidth} x ${validationSchema?.minHeight}pixels)`
        );
      } else if (
        !validateImageDimensions(renderedImage.width, renderedImage.height, {
          minWidth: validationSchema?.minWidth,
          maxWidth: validationSchema?.maxWidth,
          minHeight: validationSchema?.minHeight,
          maxHeight: validationSchema?.maxHeight,
        })
      ) {
        setImageIsValid(false);
        setImageValidationError(
          `${image.name} has dimension ${renderedImage.width} x ${renderedImage.height} pixels. It needs to be at least ${validationSchema?.minWidth} x ${validationSchema?.minHeight} and at most ${validationSchema?.maxWidth} x ${validationSchema?.maxHeight} pixels.`
        );
      } else {
        setImageIsValid(true);
        setValue(imageUrlFieldKey, renderedImageUrl);
      }
    };
  };

  return (
    <Row className="p-form__group p-form__group--top">
      <Col size={2}>
        <label htmlFor={fieldId} className="p-form__label">
          {label}:
        </label>
      </Col>
      <Col size={8}>
        {!imageIsValid && (
          <Notification severity="negative">{imageVaidationError}</Notification>
        )}

        <input type="hidden" {...register(imageUrlFieldKey)} />

        <div className="snap-image-upload-container">
          <div
            className={`snap-image-upload-drop-area ${
              isDragging ? "is-dragging" : ""
            }`}
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
            }}
            onDragOver={() => {
              setIsDragging(true);
            }}
            onDragLeave={() => {
              setIsDragging(false);
            }}
            onDrop={() => {
              setIsDragging(false);
            }}
          >
            {imageUrl ? (
              <div
                className="snap-image-upload-preview"
                style={{
                  width: `${previewWidth}px`,
                  height: `${previewHeight}px`,
                }}
              >
                <img
                  src={imageUrl}
                  width={previewWidth}
                  height={previewHeight}
                  alt=""
                />
                <div
                  className="snap-image-upload-edit"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                  }}
                >
                  <span>Edit</span>
                </div>
              </div>
            ) : (
              <div
                className="snap-add-image"
                style={{
                  width: `${previewWidth}px`,
                  height: `${previewHeight}px`,
                }}
              >
                <i className="p-icon--plus">Add image</i>
              </div>
            )}
            <input
              className="snap-image-upload-input"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
              }}
              type="file"
              accept={fileTypes}
              {...register(imageFieldKey, {
                onChange: (
                  e: SyntheticEvent<HTMLInputElement> & {
                    target: HTMLInputElement;
                  }
                ) => {
                  if (e.target.files) {
                    setImage(e.target.files[0]);
                  }
                },
              })}
            />
          </div>

          {imageUrl && (
            <button
              type="button"
              className="p-button--base"
              onClick={() => {
                setImageIsValid(true);
                setValue(imageUrlFieldKey, "", {
                  shouldDirty: window?.listingData?.banner_urls[0] !== null,
                });
                setValue(imageFieldKey, new File([], ""), {
                  shouldDirty: window?.listingData?.banner_urls[0] !== null,
                });
              }}
            >
              <i className="p-icon--delete">Remove image</i>
            </button>
          )}
        </div>

        {helpText && <div className="p-form-help-text">{helpText}</div>}

        <button
          type="button"
          className="p-button--link"
          onClick={() => {
            setShowImageRestrictions(!showImageRestrictions);
          }}
        >
          <small>
            {showImageRestrictions
              ? "Hide image restrictions"
              : "Show image restrictions"}
          </small>
        </button>
        {showImageRestrictions && (
          <ul>
            <li>
              <small>
                Accepted image formats include:{" "}
                <strong>{validationSchema?.fileTypes} files</strong>
              </small>
            </li>
            <li>
              <small>
                Min resolution:{" "}
                <strong>
                  {validationSchema?.minWidth} x {validationSchema?.minHeight}{" "}
                  pixels
                </strong>
              </small>
            </li>
            <li>
              <small>
                Max resolution:{" "}
                <strong>
                  {validationSchema?.maxWidth} x {validationSchema.maxHeight}{" "}
                  pixels
                </strong>
              </small>
            </li>
            <li>
              <small>
                Aspect ratio:{" "}
                <strong>
                  {validationSchema?.aspectRatio?.width}:
                  {validationSchema?.aspectRatio?.height}
                </strong>
              </small>
            </li>
            <li>
              <small>
                File size limit:{" "}
                <strong>{formatFileSize(validationSchema?.maxFileSize)}</strong>
              </small>
            </li>
          </ul>
        )}
      </Col>
    </Row>
  );
}

export default ImageUpload;
