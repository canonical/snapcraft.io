import type { Snap } from "../types/shared";

function getFilteredSnaps(snaps: Array<Snap>, filterQuery?: string | null) {
  if (!filterQuery) {
    return snaps;
  }

  return snaps.filter((snap: Snap) => {
    if (snap.name && snap.name.includes(filterQuery)) {
      return true;
    }

    return false;
  });
}

export default getFilteredSnaps;
