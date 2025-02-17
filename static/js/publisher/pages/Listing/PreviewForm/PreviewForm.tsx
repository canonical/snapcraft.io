import { UseFormGetValues, FieldValues, UseFormWatch } from "react-hook-form";
import { Form } from "@canonical/react-components";

type Props = {
  snapName: string;
  getValues: UseFormGetValues<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  data: {
    categories: { name: string; slug: string }[];
  };
};

type ListingData = {
  categories: { name: string; slug: string }[];
  links: {
    website: Array<string>;
    contact: Array<string>;
    donations: Array<string>;
    source: Array<string>;
    issues: Array<string>;
  };
  snap_name: string;
  title: string;
  images: Array<{
    url: string;
    type: string;
    status: string;
  }>;
  summary: string;
  description: string;
  video: { type: string; status: string; url: string }[] | null;
  license: string;
};

function PreviewForm({ snapName, getValues, watch, data }: Props) {
  const watchWebsites = watch("websites");
  const watchContacts = watch("contacts");
  const watchDonations = watch("donations");
  const watchSource = watch("source_code");
  const watchIssues = watch("issues");

  const listingData: ListingData = {
    categories: [],
    links: {
      website: watchWebsites
        ? watchWebsites.map((item: { url: string }) => item.url)
        : [],
      contact: watchContacts
        ? watchContacts.map((item: { url: string }) => item.url)
        : [],
      donations: watchDonations
        ? watchDonations.map((item: { url: string }) => item.url)
        : [],
      source: watchSource
        ? watchSource.map((item: { url: string }) => item.url)
        : [],
      issues: watchIssues
        ? watchIssues.map((item: { url: string }) => item.url)
        : [],
    },
    snap_name: snapName,
    title: getValues("title"),
    images: [
      {
        url: getValues("banner_url"),
        type: "banner",
        status: "uploaded",
      },
      {
        url: getValues("icon_url"),
        type: "icon",
        status: "uploaded",
      },
    ],
    summary: getValues("summary"),
    description: getValues("description"),
    video: null,
    license: "",
  };

  const screenshotUrls = getValues("screenshot_urls");

  if (screenshotUrls.length) {
    screenshotUrls.forEach((screenshotUrl: string) => {
      listingData.images.push({
        url: screenshotUrl,
        type: "screenshot",
        status: "uploaded",
      });
    });
  }

  const primaryCategory = getValues("primary_category");
  const secondaryCategory = getValues("secondary_category");

  if (primaryCategory) {
    const primaryCategoryData = data.categories.find(
      (cat) => cat.slug === primaryCategory,
    );

    if (primaryCategoryData) {
      listingData.categories.push(primaryCategoryData);
    }
  }

  if (secondaryCategory) {
    const secondaryCategoryData = data.categories.find(
      (cat) => cat.slug === secondaryCategory,
    );

    if (secondaryCategoryData) {
      listingData.categories.push(secondaryCategoryData);
    }
  }

  const videoUrl = getValues("video_urls");

  if (videoUrl) {
    listingData.video = [{ type: "video", status: "uploaded", url: videoUrl }];
  }

  listingData.license = getValues("license");

  if (getValues("primary_website")) {
    listingData.links.website.unshift(getValues("primary_website"));
  }

  return (
    <Form
      id="preview-form"
      action={`/${snapName}/preview`}
      method="POST"
      encType="multipart/form-data"
      className="u-hide"
      target="_blank"
      rel="opener"
    >
      <input type="hidden" name="csrf_token" defaultValue={window.CSRF_TOKEN} />
      <input
        type="hidden"
        name="state"
        defaultValue={JSON.stringify(listingData)}
      />
    </Form>
  );
}

export default PreviewForm;
