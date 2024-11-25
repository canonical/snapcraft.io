import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { nanoid } from "nanoid";
import { Row, Col, Notification } from "@canonical/react-components";

import { validateImageDimensions } from "../../../utils";

import ScreenshotList from "./ScreenshotList";

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
    append: addScreenshotUrl,
    remove: removeScreenshotUrl,
    move: moveScreenshotUrl,
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
        }KB`,
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
          `${image.name} has dimension ${renderedImage.width} x ${renderedImage.height} pixels. It needs to be at least ${validationSchema?.minWidth} x ${validationSchema?.minHeight} and at most ${validationSchema?.maxWidth} x ${validationSchema?.maxHeight} pixels.`,
        );
      } else {
        setImageIsValid(true);
        addScreenshotUrl(renderedImageUrl);
      }
    };
  };

  return (
    <Row
      className="p-form__group p-form__group--top"
      data-tour="listing-images"
    >
      <Col size={2}>
        <label htmlFor={fieldId} className="p-form__label">
          Images:
        </label>
      </Col>
      <Col size={8}>
        {!imageIsValid && (
          <Notification severity="negative">{imageVaidationError}</Notification>
        )}

        <ScreenshotList
          screenshots={screenshots}
          screenshotUrls={getValues("screenshot_urls")}
          getValues={getValues}
          removeScreenshotUrl={removeScreenshotUrl}
          setValue={setValue}
          register={register}
          setImage={setImage}
          moveScreenshotUrl={moveScreenshotUrl}
        />

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
