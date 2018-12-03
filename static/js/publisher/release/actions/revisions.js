export const UPDATE_REVISIONS = "UPDATE_REVISIONS";

export function updateRevisions(revisions) {
  return {
    type: UPDATE_REVISIONS,
    payload: { revisions }
  };
}
