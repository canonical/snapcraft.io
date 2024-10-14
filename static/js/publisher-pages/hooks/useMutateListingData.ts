import { Dispatch, SetStateAction } from "react";
import { UseFormReset, FieldValues } from "react-hook-form";
import { useMutation } from "react-query";

import { addDateToFilename, getListingChanges } from "../utils";

import type { ListingData } from "../types";

type Options = {
  data: ListingData;
  dirtyFields: { [key: string]: boolean };
  getDefaultData: (arg: ListingData) => { [key: string]: unknown };
  refetch: () => void;
  reset: UseFormReset<FieldValues>;
  setShowSuccessNotification: Dispatch<SetStateAction<boolean>>;
  setUpdateMetadataOnRelease: Dispatch<SetStateAction<boolean>>;
  shouldShowUpdateMetadataWarning: (arg: FieldValues) => boolean;
  snapName: string | undefined;
  setShowUpdateMetadataMessage: Dispatch<SetStateAction<boolean>>;
};

function useMutateListingData({
  data,
  dirtyFields,
  refetch,
  reset,
  setShowSuccessNotification,
  setUpdateMetadataOnRelease,
  shouldShowUpdateMetadataWarning,
  snapName,
  setShowUpdateMetadataMessage,
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

      if (values.banner && values.banner.length > 0) {
        formData.append("banner-image", values.banner[0]);
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

      const responseData = await response.json();

      if (!responseData.data.text_fields_updated) {
        setShowUpdateMetadataMessage(true);
      }
    },
    onSuccess: () => {
      const mainPanel = document.querySelector(".l-main") as HTMLElement;
      mainPanel.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      refetch();
      setShowSuccessNotification(true);
    },
    onSettled: (_error, _context, data) => {
      if (data) {
        reset(data);
      } else {
        reset();
      }
    },
  });
}

export default useMutateListingData;
