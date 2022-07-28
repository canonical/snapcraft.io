import React, { useState, SyntheticEvent } from "react";
import { nanoid } from "nanoid";
import { Row, Col, Notification } from "@canonical/react-components";

import { validateImageDimensions } from "../../utils";

type Props = {
  iconUrl: string | null;
  register: Function;
  setValue: Function;
};

function SnapIcon({ iconUrl, register, setValue }: Props) {
  const [showIconRestrictions, setShowIconRestrictions] = useState(false);
  const [iconValidationError, setIconValidationError] = useState("");
  const [iconIsValid, setIconIsValid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fieldId = nanoid();

  const setIcon = (image: File) => {
    const maxFileSize = 256000;
    const minResolution = 40;
    const maxResolution = 512;

    if (image.size > maxFileSize) {
      setIconIsValid(false);
      setIconValidationError(
        `${image.name} file size is over ${maxFileSize / 1000}KB`
      );
      return;
    }

    const renderedImage = new Image();
    const renderedImageUrl = URL.createObjectURL(image);

    renderedImage.src = renderedImageUrl;
    renderedImage.onload = () => {
      if (
        !validateImageDimensions(renderedImage.width, renderedImage.height, {
          minWidth: minResolution,
          maxWidth: maxResolution,
          minHeight: minResolution,
          maxHeight: maxResolution,
        })
      ) {
        setIconIsValid(false);
        setIconValidationError(
          `${image.name} has dimension ${renderedImage.width} x ${renderedImage.height} pixels. It needs to be at least ${minResolution} x ${minResolution} and at most ${maxResolution} x ${maxResolution} pixels.`
        );
      } else {
        setIconIsValid(true);
        setValue("icon_url", renderedImageUrl);
      }
    };
  };

  return (
    <Row className="p-form__group p-form__group--top">
      <Col size={2}>
        <label htmlFor={fieldId} className="p-form__label">
          Snap icon:
        </label>
      </Col>
      <Col size={8}>
        <>
          {!iconIsValid && (
            <Notification severity="negative">
              {iconValidationError}
            </Notification>
          )}
          <input type="hidden" {...register("icon_url")} />

          <div
            className={`snap-icon-drop-area ${isDragging ? "is-dragging" : ""}`}
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
            {iconUrl ? (
              <>
                <div className="snap-icon-preview">
                  <img src={iconUrl} width={120} height={120} alt="" />
                  <div className="snap-icon-edit">
                    <span>Edit</span>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    className="p-button--base snap-remove-button"
                    onClick={() => {
                      setIconIsValid(true);
                      setValue("icon_url", "");
                      setValue("icon", new File([], ""), {
                        shouldDirty: window?.listingData?.icon_url !== null,
                      });
                    }}
                  >
                    <i className="p-icon--delete">Remove icon</i>
                  </button>
                </div>
              </>
            ) : (
              <div className="snap-add-icon">
                <i className="p-icon--plus">Add icon</i>
              </div>
            )}
            <input
              className="snap-icon-input"
              type="file"
              accept="image/png, image/jpeg, image/svg+xml"
              {...register("icon", {
                onChange: (
                  e: SyntheticEvent<HTMLInputElement> & {
                    target: HTMLInputElement;
                  }
                ) => {
                  if (e.target.files) {
                    setIcon(e.target.files[0]);
                  }
                },
              })}
            />
          </div>

          <button
            type="button"
            className="p-button--link"
            onClick={() => {
              setShowIconRestrictions(!showIconRestrictions);
            }}
          >
            <small>
              {showIconRestrictions
                ? "Hide icon restrictions"
                : "Show icon restrictions"}
            </small>
          </button>
          {showIconRestrictions && (
            <ul>
              <li>
                <small>
                  Accepted image formats include:{" "}
                  <strong>PNG, JPEG & SVG files</strong>
                </small>
              </li>
              <li>
                <small>
                  Min resolution: <strong>40 x 40 pixels</strong>
                </small>
              </li>
              <li>
                <small>
                  Max resolution: <strong>512 x 512 pixels</strong>
                </small>
              </li>
              <li>
                <small>
                  Aspect ratio: <strong>1:1</strong>
                </small>
              </li>
              <li>
                <small>
                  File size limit: <strong>256kB</strong>
                </small>
              </li>
            </ul>
          )}
        </>
      </Col>
    </Row>
  );
}

export default SnapIcon;
