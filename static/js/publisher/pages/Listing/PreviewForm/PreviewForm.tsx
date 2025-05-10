import { FieldValues, UseFormWatch } from "react-hook-form";
import { Form } from "@canonical/react-components";

type Props = {
  snapName: string;
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

function PreviewForm({ snapName, watch, data }: Props) {
  const watchWebsites = watch("websites");
  const watchContacts = watch("contacts");
  const watchDonations = watch("donations");
  const watchSource = watch("source_code");
  const watchIssues = watch("issues");
  const watchTitle = watch("title");
  const watchBannerUrls = watch("banner_urls");
  const watchIconUrl = watch("icon_url");
  const watchSummary = watch("summary");
  const watchDescription = watch("description");
  const watchScreenshotUrls = watch("screenshot_urls");
  const watchPrimaryCategory = watch("primary_category");
  const watchSecondaryCategory = watch("secondary_category");
  const watchVideoUrls = watch("video_urls");
  const watchLicense = watch("license");
  const watchPrimaryWebsite = watch("primary_website");

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
    title: watchTitle,
    images: [
      {
        url: watchBannerUrls ? watchBannerUrls : null,
        type: "banner",
        status: "uploaded",
      },
      {
        url: watchIconUrl,
        type: "icon",
        status: "uploaded",
      },
    ],
    summary: watchSummary,
    description: watchDescription,
    video: null,
    license: "",
  };

  const screenshotUrls = watchScreenshotUrls;

  if (screenshotUrls.length) {
    screenshotUrls.forEach((screenshotUrl: string) => {
      listingData.images.push({
        url: screenshotUrl,
        type: "screenshot",
        status: "uploaded",
      });
    });
  }

  const primaryCategory = watchPrimaryCategory;
  const secondaryCategory = watchSecondaryCategory;

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

  const videoUrl = watchVideoUrls;

  if (videoUrl) {
    listingData.video = [{ type: "video", status: "uploaded", url: videoUrl }];
  }

  listingData.license = watchLicense;

  const primaryWebsite = watchPrimaryWebsite;
  if (primaryWebsite) {
    listingData.links.website.unshift(primaryWebsite);
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
        data-testid="state-input"
        defaultValue={JSON.stringify(listingData)}
      />
    </Form>
  );
}

export default PreviewForm;
