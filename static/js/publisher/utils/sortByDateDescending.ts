function sortByDateDescending(
  a: { "created-at": string },
  b: { "created-at": string },
) {
  if (a["created-at"] > b["created-at"]) {
    return -1;
  }

  if (a["created-at"] < b["created-at"]) {
    return 1;
  }

  return 0;
}

export default sortByDateDescending;
