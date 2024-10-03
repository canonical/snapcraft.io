import { useMutation } from "react-query";

import { addDateToFilename, getListingChanges } from "../utils";

import type { ListingData } from "../types";

type Options = {
  data: ListingData;
  dirtyFields: any;
  getDefaultData: Function;
  refetch: Function;
  reset: Function;
  setShowSuccessNotification: Function;
  setUpdateMetadataOnRelease: Function;
  shouldShowUpdateMetadataWarning: Function;
  snapName: string | undefined;
};

function useMutateListingData({
  data,
  dirtyFields,
  getDefaultData,
  refetch,
  reset,
  setShowSuccessNotification,
  setUpdateMetadataOnRelease,
  shouldShowUpdateMetadataWarning,
  snapName,
}: Options) {
  return useMutation({
    mutationFn: async (values: any) => {
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

            const imageIndex = changes.images.findIndex(
              (image: any) => image.name === oldName
            );
            changes.images[imageIndex].name = newFile.name;
            changes.images[imageIndex].url = URL.createObjectURL(newFile);
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
    },
    onSuccess: async () => {
      const response = await refetch();
      setShowSuccessNotification(true);
      reset(getDefaultData(response.data));

      const mainPanel = document.querySelector(".l-main") as HTMLElement;
      mainPanel.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    },
  });
}

export default useMutateListingData;
