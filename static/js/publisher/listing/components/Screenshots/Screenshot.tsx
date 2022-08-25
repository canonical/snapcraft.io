import React, { SyntheticEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  field: { id: string };
  index: number;
  screenshotUrls: Array<string>;
  getValues: Function;
  removeScreenshotUrl: Function;
  setValue: Function;
  register: Function;
  setImage: Function;
};

function Screenshot({
  field,
  index,
  screenshotUrls,
  getValues,
  removeScreenshotUrl,
  setValue,
  register,
  setImage,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const screenshotUrl = getValues(`screenshot_urls.${index}`);

  return (
    <div
      ref={screenshotUrl ? setNodeRef : null}
      style={style}
      {...attributes}
      {...listeners}
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

        {!screenshotUrl && (
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
        )}
      </div>
    </div>
  );
}

export default Screenshot;
