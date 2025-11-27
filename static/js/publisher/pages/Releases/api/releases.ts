import {
  CloseChannelsResponse,
  FetchReleasePayload,
  FetchReleaseResponse,
  ReleasesAPIResponse,
} from "../../../types/releaseTypes";
import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../constants";

export function fetchReleases(
  onComplete: (
    json: FetchReleaseResponse,
    release: FetchReleasePayload
  ) => void,
  releases: FetchReleasePayload[],
  snapName: string
) {
  let queue = Promise.resolve();

  // handle releases as a queue
  releases.forEach((release) => {
    return (queue = queue.then(() => {
      return fetchRelease(
        snapName,
        release.id,
        release.channels,
        release.progressive
      ).then((json) => onComplete(json, release));
    }));
  });

  return queue;
}

export function fetchSnapReleaseStatus(
  snapName: string
): Promise<ReleasesAPIResponse> {
  return fetch(`/api/${snapName}/releases`, {
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
  })
    .then((response) => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}

export function fetchRelease(
  snapName: string,
  revision: number,
  channels: FetchReleasePayload["channels"],
  progressive: FetchReleasePayload["progressive"]
) {
  const body = {
    name: snapName,
    revision,
    channels,
    ...(progressive ? { progressive } : {}),
  };

  return fetch(`/${snapName}/releases`, {
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
  })
    .then((response) => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}

export function fetchCloses(
  onComplete: (response: CloseChannelsResponse) => void,
  snapName: string,
  channels: string[]
) {
  if (channels && channels.length) {
    return fetchClose(snapName, channels).then((json) => {
      onComplete(json);
    });
  } else {
    return Promise.resolve();
  }
}

export function fetchClose(
  snapName: string,
  channels: string[]
): Promise<CloseChannelsResponse> {
  return fetch(`/${snapName}/releases/close-channel`, {
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
  })
    .then((response) => response.json() as Promise<CloseChannelsResponse>)
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}
