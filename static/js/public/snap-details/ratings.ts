interface RatingsData {
  snap_id: string;
  total_votes: number;
  ratings_band: string;
}

async function fetchSnapRatings(snapId: string): Promise<RatingsData | null> {
  try {
    const response = await fetch(`/api/snap/${snapId}/ratings`);

    if (!response.ok) {
      console.error(
        `Failed to fetch ratings for snap ${snapId}:`,
        response.status,
      );
      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`Error fetching ratings for snap ${snapId}:`, error);
    return null;
  }
}

function renderRatingsInfo(
  ratingsData: RatingsData | null,
  containerSelector: string,
): void {
  const container = document.querySelector(containerSelector) as HTMLElement;

  if (!container) {
    return;
  }

  if (!ratingsData) {
    return;
  }

  const ratingsBand = ratingsData.ratings_band;
  let icon = "";
  let text = "";

  switch (ratingsBand) {
    case "very-good":
      icon = "p-icon--thumbs-up";
      text = "Very good";
      break;
    case "good":
      icon = "p-icon--thumbs-up";
      text = "Good";
      break;
    case "neutral":
      icon = "p-icon--minus";
      text = "Neutral";
      break;
    case "poor":
      icon = "p-icon--thumbs-down";
      text = "Poor";
      break;
    case "very-poor":
      icon = "p-icon--thumbs-down";
      text = "Very poor";
      break;
    default:
      return;
  }

  const title = text.charAt(0).toUpperCase() + text.slice(1) + " rating";
  const html = `
    <span class="p-snap-ratings">
      <span title="${title}"><i class="${icon}"></i> ${text}</span>
      <span> (${ratingsData.total_votes} votes)</span>
    </span>
  `;

  const list = document.querySelector(containerSelector);
  if (list) {
    const li = document.createElement("li");
    li.className = "p-inline-list__item";
    li.innerHTML = html;
    list.appendChild(li);
  }
}

export default function initSnapRatings(
  snapId: string,
  containerSelectors: string[],
): void {
  if (!snapId) {
    return;
  }

  fetchSnapRatings(snapId).then((ratingsData) => {
    containerSelectors.forEach((selector) => {
      renderRatingsInfo(ratingsData, selector);
    });
  });
}

export { fetchSnapRatings, renderRatingsInfo, RatingsData };
