import type {
  CloseChannelsResponse,
  FetchReleasePayload,
  FetchReleaseResponse,
  ReleasesAPIResponse,
} from "../../../types/releaseTypes";
import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../constants";

export async function fetchReleases(
  onComplete: (
    json: FetchReleaseResponse,
    release: FetchReleasePayload
  ) => void,
  releases: FetchReleasePayload[],
  snapName: string
) {
  for (const release of releases) {
    const json = await fetchRelease(
      snapName,
      release.id,
      release.channels,
      release.progressive
    );
    onComplete(json, release);
  }
}

export async function fetchSnapReleaseStatus(
  snapName: string
): Promise<ReleasesAPIResponse> {
  try {
    const response = await fetch(`/api/${snapName}/releases`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": window.CSRF_TOKEN,
      },
      redirect: "follow",
      referrer: "no-referrer",
    });
    return await response.json();
  } catch {
    throw new Error(ERROR_MESSAGE);
  }
}

export async function fetchRelease(
  snapName: string,
  revision: number,
  channels: FetchReleasePayload["channels"],
  progressive: FetchReleasePayload["progressive"]
): Promise<FetchReleaseResponse> {
  const body = {
    name: snapName,
    revision,
    channels,
    ...(progressive ? { progressive } : {}),
  };

  try {
    const response = await fetch(`/${snapName}/releases`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": window.CSRF_TOKEN,
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch {
    throw new Error(ERROR_MESSAGE);
  }
}

export async function fetchCloses(
  onComplete: (response: CloseChannelsResponse) => void,
  snapName: string,
  channels: string[]
): Promise<void> {
  if (channels && channels.length) {
    const json = await fetchClose(snapName, channels);
    onComplete(json);
  } else {
    return Promise.resolve();
  }
}

export async function fetchClose(
  snapName: string,
  channels: string[]
): Promise<CloseChannelsResponse> {
  try {
    const response = await fetch(`/${snapName}/releases/close-channel`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": window.CSRF_TOKEN,
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify({ channels }),
    });
    return await response.json();
  } catch {
    throw new Error(ERROR_MESSAGE);
  }
}
