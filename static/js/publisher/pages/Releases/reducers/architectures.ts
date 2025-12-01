import { UPDATE_ARCHITECTURES } from "../actions/architectures";
import {
  ReleasesAction,
  ReleasesReduxState,
} from "../../../types/releaseTypes";

type UpdateArchitecturesAction = ReleasesAction & {
  payload: {
    architectures: ReleasesReduxState["architectures"];
  };
};

export default function architectures(state: ReleasesReduxState["architectures"] = [], action: UpdateArchitecturesAction) {
  switch (action.type) {
    case UPDATE_ARCHITECTURES:
      return [...action.payload.architectures];
    default:
      return state;
  }
}
