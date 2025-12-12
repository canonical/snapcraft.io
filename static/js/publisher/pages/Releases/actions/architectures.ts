import {
  GenericReleasesAction,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";

export const UPDATE_ARCHITECTURES = "UPDATE_ARCHITECTURES";

export type UpdateArchitecturesAction = GenericReleasesAction<
  typeof UPDATE_ARCHITECTURES,
  {
    architectures: ReleasesReduxState["architectures"];
  }
>;

export type ArchitecturesAction = UpdateArchitecturesAction;

export function updateArchitectures(
  revisions: Revision[]
): UpdateArchitecturesAction {
  let archs: string[] = [];

  revisions.forEach((revision) => {
    archs = archs.concat(revision.architectures);
  });

  // make archs unique and sorted
  archs = archs.filter((item, i, ar) => ar.indexOf(item) === i);

  return {
    type: UPDATE_ARCHITECTURES,
    payload: {
      architectures: archs,
    },
  };
}
