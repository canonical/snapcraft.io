import {
  GenericReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

export const UPDATE_REVISIONS = "UPDATE_REVISIONS";

export type UpdateRevisionsAction = GenericReleasesAction<
  typeof UPDATE_REVISIONS,
  {
    revisions: ReleasesReduxState["revisions"];
  }
>;

export type RevisionsAction = UpdateRevisionsAction;

export function updateRevisions(
  revisions: ReleasesReduxState["revisions"]
): UpdateRevisionsAction {
  return {
    type: UPDATE_REVISIONS,
    payload: { revisions },
  };
}
