function filterSnapsByQuery(snap, query) {
  return snap.name.toLowerCase().includes(query);
}

export default filterSnapsByQuery;
