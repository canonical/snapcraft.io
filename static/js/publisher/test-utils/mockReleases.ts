/* eslint-disable prettier/prettier */
import { Release } from "../types/releaseTypes";

export const mockReleases: Release[] = [
  {
    architecture: "arm64",
    branch: null,
    channel: "latest/stable",
    "expiration-date": null,
    progressive: {
      "current-percentage": null,
      percentage: null,
    },
    revision: 61,
    risk: "edge",
    track: "latest",
    when: "2025-05-01T09:31:37Z",
  },
  {
    architecture: "arm64",
    branch: "ubuntu-core-desktop",
    channel: "latest/edge",
    "expiration-date": null,
    progressive: {
      "current-percentage": null,
      percentage: null,
    },
    revision: 58,
    risk: "stable",
    track: "latest",
    when: "2025-04-30T18:21:01Z",
  },
  {
    architecture: "arm64",
    branch: "ubuntu-core-desktop",
    channel: "latest/edge",
    "expiration-date": null,
    progressive: {
      "current-percentage": null,
      percentage: 10,
    },
    revision: 54,
    risk: "stable",
    track: "latest",
    when: "2025-04-30T18:21:01Z",
  },
];

export function createMockRelease(
  partialRelease: Partial<Release>,
): Release {
  return {
    architecture: "amd64",
    branch: null,
    "expiration-date": null,
    revision: 54,
    risk: "stable",
    track: "latest",
    when: "2025-04-30T18:21:01Z",
    // add custom passed props
    ...partialRelease,
    progressive: {
      "current-percentage": null,
      percentage: null,
      ...partialRelease.progressive
    },
  } as Release;
}
