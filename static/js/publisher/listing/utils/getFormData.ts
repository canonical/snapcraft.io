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

  formData.set("changes", JSON.stringify(changes));

  if (data?.icon) {
    formData.append("icon", data?.icon[0]);
  }

  if (data?.banner) {
    formData.append("banner-image", data?.banner[0]);
  }

  if (data?.screenshots) {
    data?.screenshots.forEach((screenshot: FileList) => {
      formData.append("screenshots", screenshot[0]);
    });
  }

  return formData;
}

export default getFormData;
