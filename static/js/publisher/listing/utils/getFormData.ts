const addDateToFilename = (file: File): File => {
  const now = Math.round(new Date().getTime() / 1000);
  const nameParts = file.name.split(".");
  const extension = nameParts.pop();
  const newName = `${nameParts.join(".")}-${now}.${extension}`;
  return new File([file], newName);
};

const formatLinkFields = (fields: Array<{ url: string }>) => {
  return fields.map((item) => item.url);
};

function getFormData(
  data: { [key: string]: any },
  snapId: string,
  changes: { [key: string]: any }
) {
  const formData = new FormData();

  formData.set("csrf_token", window.CSRF_TOKEN);
  formData.set("snap_id", snapId);

  if (changes.title) {
    formData.set("title", data?.title);
  }

  if (changes.summary) {
    formData.set("summary", data?.summary);
  }

  if (changes.description) {
    formData.set("description", data?.description);
  }

  if (changes.video_urls) {
    formData.set("video_urls", data?.video_urls);
  }

  if (changes.website) {
    formData.set("website", data?.website);
  }

  if (changes.contact) {
    formData.set("contact", data?.contact);
  }

  if (changes.categories) {
    formData.set("primary-category", data?.["primary-category"]);
    formData.set("secondary-category", data?.["secondary-category"]);
  }

  if (changes.public_metrics_enabled) {
    formData.set("public_metrics_enabled", data?.public_metrics_enabled);
  }

  if (changes.public_metrics_blacklist) {
    formData.set("public_metrics_blacklist", data?.public_metrics_blacklist);
  }

  if (changes.license) {
    formData.set("license", data?.license || "unset");
  }

  // The currently uploaded images
  if (changes.images) {
    formData.set("images", data?.["images"]);
  }

  if (changes.links) {
    formData.set(
      "links",
      JSON.stringify({
        contact: formatLinkFields(data?.contacts),
        donation: formatLinkFields(data?.donations),
        issues: formatLinkFields(data?.issues),
        "source-code": formatLinkFields(data?.["source-code"]),
        website: formatLinkFields(data?.websites),
      })
    );
  }

  if (data?.icon?.[0]) {
    formData.append("icon", data.icon[0]);
  }

  if (data?.banner?.[0]) {
    formData.append("banner-image", data.banner[0]);
  }

  if (data?.screenshots) {
    data?.screenshots.forEach((screenshot: FileList) => {
      if (screenshot[0]) {
        // Add a timestamp to the filename
        const oldName = screenshot[0].name;
        const newFile = addDateToFilename(screenshot[0]);

        formData.append("screenshots", newFile);

        // update changes object
        const imageIndex = changes.images.findIndex((image: any) => image.name === oldName);
        changes.images[imageIndex].name = newFile.name;
        changes.images[imageIndex].url = URL.createObjectURL(newFile);
      }
    });
  }

  // Set changes last, just incase any modifications have happened
  formData.set("changes", JSON.stringify(changes));

  return formData;
}

export default getFormData;
