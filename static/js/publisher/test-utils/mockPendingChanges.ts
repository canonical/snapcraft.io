import type {
  PendingChangesState,
  PendingRelease,
  PendingReleaseItem,
  Progressive,
  Revision,
} from "../types/releaseTypes";
import { createMockRevision } from "./mockRevisions";

type PartialPendingRelease = {
  revision: number;
  channel: string;
  pendingReleaseItem: PartialPendingReleaseItem;
};

export function createMockPendingChanges(
  partialPendingReleases: PartialPendingRelease[],
  pendingCloses: string[],
): PendingChangesState {
  return {
    changeOrderIndex: partialPendingReleases.length + pendingCloses.length,
    pendingCloses: createMockPendingCloses(pendingCloses),
    pendingReleases: createMockPendingReleases(
      partialPendingReleases,
      pendingCloses.length,
    ),
  };
}

type PendingCloses = {
  [order: number]: string;
};

export function createMockPendingCloses(
  pendingCloses: string[],
  startIndex = 0,
) {
  const result: PendingCloses = {};
  for (const pendingClose of pendingCloses) {
    result[startIndex] = pendingClose;
    ++startIndex;
  }
  return result;
}

type PendingReleases = {
  [order: number]: PendingRelease;
};

export function createMockPendingReleases(
  partialPendingReleases: PartialPendingRelease[],
  startIndex = 0,
) {
  // first sort the pending releases passed by revision
  partialPendingReleases.sort((a, b) => a.revision - b.revision);
  const result: PendingReleases = {};
  // there are no revisions with negative numbers, so the first iteration
  // will always enter the if and increase the index back to its original value
  let previousRevision = -1;
  --startIndex;

  for (const pendingRelease of partialPendingReleases) {
    const channel =
      pendingRelease.pendingReleaseItem.channel || "latest/stable";
    if (pendingRelease.revision !== previousRevision) {
      // if it's the same revision then the changes go into the same index
      ++startIndex;
    }
    if (result[startIndex]) {
      result[startIndex].channels = {
        ...result[startIndex].channels,
        [channel]: createMockPendingReleaseItem(
          pendingRelease.pendingReleaseItem,
        ),
      };
    } else {
      result[startIndex] = {
        revision: pendingRelease.revision,
        channels: {
          [channel]: createMockPendingReleaseItem(
            pendingRelease.pendingReleaseItem,
          ),
        },
      };
    }
    previousRevision = pendingRelease.revision;
  }

  return result;
}

type PartialPendingReleaseItem = Partial<{
  revision: Partial<Revision>;
  previousReleases: Partial<Revision>[];
  channel: string;
  progressive: Partial<Progressive>;
  replaces: PartialPendingReleaseItem;
}>;

export function createMockPendingReleaseItem(
  partialPendingReleaseItem: PartialPendingReleaseItem,
) {
  return {
    channel: "latest/stable",
    previousReleases: [],
    progressive: {
      "current-percentage": null,
      percentage: null,
    },
    replaces: undefined,
    ...partialPendingReleaseItem,
    revision: createMockRevision(partialPendingReleaseItem.revision || {}),
  } as PendingReleaseItem;
}
