import { useState, SyntheticEvent } from "react";
import { nanoid } from "nanoid";
import {
  Row,
  Col,
  Notification,
  Switch,
  Icon,
} from "@canonical/react-components";

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
  tourLabel: string;
  hasDarkThemePreview?: boolean;
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
  tourLabel,
  hasDarkThemePreview,
}: Props) {
  const [showImageRestrictions, setShowImageRestrictions] = useState(false);
  const [imageVaidationError, setImageValidationError] = useState("");
  const [imageIsValid, setImageIsValid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(imageUrl);

  const fieldId = nanoid();
  const isDark = hasDarkThemePreview && darkThemeEnabled;

  const darkThemeStyles = {
    backgroundColor: hasDarkThemePreview && isDark ? "#2f2f2f" : "#f7f7f7",
    color: isDark ? "#fff" : "#111",
    padding: hasDarkThemePreview ? "1rem 1rem 0" : "0",
    display: "flex",
  };

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
          width: validationSchema?.aspectRatio?.width,
          height: validationSchema?.aspectRatio?.height,
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
        setPreviewImageUrl(renderedImageUrl);
      }
    };
  };

  return (
    <Row className="p-form__group p-form__group--top">
      <Col size={2} data-tour={tourLabel}>
        <label htmlFor={fieldId} className="p-form__label">
          {label}:
        </label>
      </Col>
      <Col size={8}>
        {!imageIsValid && (
          <Notification severity="negative">{imageVaidationError}</Notification>
        )}

        <input type="hidden" {...register(imageUrlFieldKey)} />
        <div style={hasDarkThemePreview ? darkThemeStyles : {}}>
          <div className="snap-image-upload-container" data-tour={tourLabel}>
            <div
              className={`snap-image-upload-drop-area ${
                isDragging ? "is-dragging" : ""
              }`}
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                marginRight:
                  hasDarkThemePreview && !previewImageUrl ? "1rem" : "0",
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
              {previewImageUrl ? (
                <div
                  className="snap-image-upload-preview"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                  }}
                >
                  <img
                    src={previewImageUrl}
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
                    backgroundColor: isDark ? "#666" : "#d9d9d9",
                  }}
                >
                  <Icon name="plus" light={isDark}>
                    Add image
                  </Icon>
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

            {previewImageUrl && (
              <button
                type="button"
                className="p-button--base snap-remove-icon"
                onClick={() => {
                  setImageIsValid(true);
                  setValue(imageUrlFieldKey, "", {
                    shouldDirty: window?.listingData?.banner_urls[0] !== null,
                  });
                  setValue(imageFieldKey, new File([], ""), {
                    shouldDirty: window?.listingData?.banner_urls[0] !== null,
                  });
                  setPreviewImageUrl("");
                }}
              >
                <Icon name="delete" light={isDark}>
                  Remove image
                </Icon>
              </button>
            )}
          </div>

          {hasDarkThemePreview && (
            <div>
              <Switch
                label="Dark theme"
                onChange={(
                  e: SyntheticEvent<HTMLInputElement> & {
                    target: HTMLInputElement;
                  }
                ) => {
                  if (e.target.checked) {
                    setDarkThemeEnabled(true);
                  } else {
                    setDarkThemeEnabled(false);
                  }
                }}
              />
              <small>
                This is how your application&rsquo;s icon will look in{" "}
                {darkThemeEnabled ? "dark" : "light"} theme
              </small>
            </div>
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
