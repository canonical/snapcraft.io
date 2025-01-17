import "whatwg-fetch";

import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../constants";

export function fetchReleases(onComplete, releases, csrfToken, snapName) {
  let queue = Promise.resolve(); // Q() in q

  // handle releases as a queue
  releases.forEach((release) => {
    return (queue = queue.then(() => {
      return fetchRelease(
        csrfToken,
        snapName,
        release.id,
        release.channels,
        release.progressive,
      ).then((json) => onComplete(json, release));
    }));
  });

  return queue;
}

export function fetchReleasesHistory(csrfToken, snapName) {
  return fetch(`/${snapName}/releases/json`, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken,
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
  csrfToken,
  snapName,
  revision,
  channels,
  progressive,
) {
  const body = {
    name: snapName,
    revision,
    channels,
  };

  if (progressive) {
    body.progressive = progressive;
  }

  return fetch(`/${snapName}/releases`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken,
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

export function fetchCloses(onComplete, csrfToken, snapName, channels) {
  if (channels && channels.length) {
    return fetchClose(csrfToken, snapName, channels).then((json) => {
      onComplete(json, channels);
    });
  } else {
    return Promise.resolve();
  }
}

export function fetchClose(csrfToken, snapName, channels) {
  return fetch(`/${snapName}/releases/close-channel`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken,
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify({ channels }),
  })
    .then((response) => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}
