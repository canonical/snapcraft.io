import React, { useState, SyntheticEvent } from "react";
import { useFieldArray } from "react-hook-form";
import { nanoid } from "nanoid";
import { Row, Col, Notification } from "@canonical/react-components";

import { validateImageDimensions } from "../../utils";

type Props = {
  register: Function;
  control: any;
  getValues: Function;
  setValue: Function;
};

function Screenshots({ register, control, getValues, setValue }: Props) {
  const [showImageRestrictions, setShowImageRestrictions] = useState(false);
  const [imageVaidationError, setImageValidationError] = useState("");
  const [imageIsValid, setImageIsValid] = useState(true);

  const {
    fields: screenshotUrls,
    append: addScreenshotUrl,
    remove: removeScreenshotUrl,
  } = useFieldArray({
    control,
    name: "screenshot_urls",
  });

  const { fields: screenshots } = useFieldArray({
    control,
    name: "screenshots",
  });

  const fieldId = nanoid();

  const validationSchema = {
    maxFileSize: 2000000,
    minWidth: 480,
    maxWidth: 4320,
    minHeight: 480,
    maxHeight: 2160,
  };

  const setImage = (image: File) => {
    if (image.size > validationSchema?.maxFileSize) {
      setImageIsValid(false);
      setImageValidationError(
        `${image.name} file size is over ${
          validationSchema?.maxFileSize / 1000000
        }KB`
      );
      return;
    }

    const renderedImage = new Image();
    const renderedImageUrl = URL.createObjectURL(image);

    renderedImage.src = renderedImageUrl;
    renderedImage.onload = () => {
      if (
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
        addScreenshotUrl(renderedImageUrl);
      }
    };
  };

  return (
    <Row className="p-form__group p-form__group--top">
      <Col size={2} data-tour="listing-images">
        <label htmlFor={fieldId} className="p-form__label">
          Images:
        </label>
      </Col>
      <Col size={8} data-tour="listing-images">
        {!imageIsValid && (
          <Notification severity="negative">{imageVaidationError}</Notification>
        )}

        <div className="p-listing-images">
          {screenshots.map((field, index) => {
            const screenshotUrl = getValues(`screenshot_urls.${index}`);

            return (
              <div
                key={field.id}
                className="snap-image-upload-container p-listing-images__image"
              >
                <div className="snap-image-upload-drop-area">
                  {screenshotUrl ? (
                    <div className="snap-image-box">
                      <div>
                        <img src={screenshotUrl} alt="" width={132} />
                      </div>
                      <button
                        type="button"
                        className="p-button--base"
                        onClick={() => {
                          removeScreenshotUrl(index);
                          setValue(`screenshots.${index}`, new File([], ""));
                        }}
                      >
                        <i className="p-icon--delete">Remove screenshot</i>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="snap-add-image"
                      style={{
                        width: "132px",
                        height: "132px",
                      }}
                    >
                      {index <= screenshotUrls.length && (
                        <i className="p-icon--plus">Add image</i>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    disabled={screenshotUrl || index > screenshotUrls.length}
                    accept="image/gif, image/png, image/jpeg"
                    className="snap-image-upload-input"
                    style={{
                      width: "132px",
                      height: "132px",
                    }}
                    {...register(`screenshots.${index}`, {
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
              </div>
            );
          })}
        </div>

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
                <strong>GIF, JPEG & PNG files</strong>
              </small>
            </li>
            <li>
              <small>
                Min resolution: <strong>480 x 480 pixels</strong>
              </small>
            </li>
            <li>
              <small>
                Max resolution: <strong>3840 x 2160 pixels</strong>
              </small>
            </li>
            <li>
              <small>
                Aspect ratio: <strong>Between 1:2 and 2:1</strong>
              </small>
            </li>
            <li>
              <small>
                File size limit: <strong>2MB</strong>
              </small>
            </li>
            <li>
              <small>
                Animation min fps: <strong>1</strong>
              </small>
            </li>
            <li>
              <small>
                Animation max fps: <strong>30</strong>
              </small>
            </li>
            <li>
              <small>
                Animation max length: <strong>40 seconds</strong>
              </small>
            </li>
          </ul>
        )}
      </Col>
    </Row>
  );
}

export default Screenshots;
