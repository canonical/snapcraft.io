import filterSnapsByQuery from "./filter-snaps-by-query";

function getFilteredSnaps(snaps, query) {
  if (!query) {
    return snaps;
  }

  return snaps.filter((snap) => filterSnapsByQuery(snap, query));
}

export default getFilteredSnaps;
