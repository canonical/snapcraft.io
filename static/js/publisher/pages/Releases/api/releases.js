import "whatwg-fetch";

import { DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE } from "../constants";

export function fetchReleases(onComplete, releases, snapName) {
  let queue = Promise.resolve(); // Q() in q

  // handle releases as a queue
  releases.forEach((release) => {
    return (queue = queue.then(() => {
      return fetchRelease(
        snapName,
        release.id,
        release.channels,
        release.progressive,
      ).then((json) => onComplete(json, release));
    }));
  });

  return queue;
}

export function fetchSnapReleaseStatus(snapName) {
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

export function fetchRelease(snapName, revision, channels, progressive) {
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

export function fetchCloses(onComplete, snapName, channels) {
  if (channels && channels.length) {
    return fetchClose(snapName, channels).then((json) => {
      onComplete(json, channels);
    });
  } else {
    return Promise.resolve();
  }
}

export function fetchClose(snapName, channels) {
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
    .then((response) => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}
