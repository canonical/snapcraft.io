import type {
  PendingChangesState,
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
  [order: number]: PendingReleaseItem;
};

export function createMockPendingReleases(
  partialPendingReleases: PartialPendingRelease[],
  startIndex = 0,
) {
  const result: PendingReleases = {};

  for (const partialPendingRelease of partialPendingReleases) {
    const channel =
      partialPendingRelease.pendingReleaseItem.channel ?? partialPendingRelease.channel;
    result[startIndex] = createMockPendingReleaseItem({
      ...partialPendingRelease.pendingReleaseItem,
      channel,
    });
    startIndex++;
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
