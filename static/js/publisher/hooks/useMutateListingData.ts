import { Dispatch, SetStateAction } from "react";
import { UseFormReset, FieldValues } from "react-hook-form";
import { useMutation, UseMutationOptions } from "react-query";

import { addDateToFilename, getListingChanges } from "../utils";

import type { ListingData, StatusNotification } from "../types";

type Options = {
  data: ListingData;
  dirtyFields: { [key: string]: boolean };
  getDefaultData: (arg: ListingData) => { [key: string]: unknown };
  refetch: () => void;
  reset: UseFormReset<FieldValues>;
  setStatusNotification: Dispatch<SetStateAction<StatusNotification>>;
  setUpdateMetadataOnRelease: Dispatch<SetStateAction<boolean>>;
  shouldShowUpdateMetadataWarning: (arg: FieldValues) => boolean;
  snapName: string | undefined;
};

export type MutationResponse = {
  success: boolean;
  errors: Array<{ code: string; message: string }>;
};

function useMutateListingData({
  data,
  dirtyFields,
  refetch,
  reset,
  setStatusNotification,
  setUpdateMetadataOnRelease,
  shouldShowUpdateMetadataWarning,
  snapName,
}: Options) {
  return useMutation({
    mutationFn: async (values: FieldValues) => {
      const formData = new FormData();

      const changes = getListingChanges(dirtyFields, values, data);

      formData.set("csrf_token", window.CSRF_TOKEN);
      formData.set("snap_id", data.snap_id);

      if (values.icon && values.icon.length > 0) {
        formData.append("icon", values.icon[0]);
      }

      // In regards to banners, the `banner` field is the file itself
      // and the `banner_urls` is a string with the blob URL of the
      // uploaded banner. If `banner` is a `dirtyField`, that means
      // the banner itself has changed,
      // whereas if `banner_urls` shows as a `dirtyField`,
      // the banner would have been removed

      // If the banner field has changed we need to remove
      // the existing banner from the changes.images array,
      // otherwise it overrides it and causes a
      // "modified during validation" error
      if (dirtyFields.banner && changes.images) {
        changes.images = changes.images.filter(
          (image) => image.type !== "banner",
        );
      }

      // If there is a File for the banner, it must
      // be appended to the formData in order
      // to be uploaded
      if (values.banner && values.banner.length > 0) {
        formData.append("banner-image", values.banner[0]);
      }

      // If the banner_urls field has changed, we need to set
      // the banner URL property in the changes.images array
      // to the value of that field, otherwise the value doesn't
      // change and therefore the banner doesn't change
      if (changes.images && dirtyFields.banner_urls) {
        const banner = changes.images.find((image) => image.type === "banner");

        if (banner) {
          banner.url = values.banner_urls;
        }
      }

      if (values.screenshots) {
        values.screenshots.forEach((screenshot: FileList) => {
          if (screenshot[0]) {
            const oldName = screenshot[0].name;
            const newFile = addDateToFilename(screenshot[0], new Date());

            formData.append("screenshots", newFile);

            const imageIndex = changes?.images?.findIndex(
              (image: {
                url: string;
                type: string;
                status: string;
                name?: string;
              }) => image.name === oldName,
            );
            if (changes.images && imageIndex) {
              changes.images[imageIndex].name = newFile.name;
              changes.images[imageIndex].url = URL.createObjectURL(newFile);
            }
          }
        });
      }

      formData.set("changes", JSON.stringify(changes));

      const response = await fetch(`/api/${snapName}/listing`, {
        method: "POST",
        body: formData,
      });

      if (shouldShowUpdateMetadataWarning(values)) {
        setUpdateMetadataOnRelease(false);
      }

      if (!response.ok) {
        throw new Error("There was a problem saving listing data");
      }
      return (await response.json()) as MutationResponse;
    },
    onSuccess: (data: MutationResponse) => {
      const mainPanel = document.querySelector(".l-main") as HTMLElement;
      if (mainPanel) {
        mainPanel.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
      refetch();
      if (data.errors && data.errors.length > 0) {
        setStatusNotification({
          success: false,
          message: data.errors.map((value) => value.message),
        });
      } else {
        setStatusNotification({
          success: true,
          message: "Changes applied successfully.",
        });
      }
    },
    onSettled: (
      _data: MutationResponse,
      _error: unknown,
      values: FieldValues,
    ) => {
      if (values) {
        reset(values);
      } else {
        reset();
      }
    },
  } as UseMutationOptions<MutationResponse, unknown, FieldValues, unknown>);
}

export default useMutateListingData;
