import { ReleasesReduxState } from "../../../types/releaseTypes";

// Currently these options are only set as initial state in
// static/js/publisher/pages/Releases/Release.tsx
export default function options(
  state: ReleasesReduxState["options"] = { flags: {} }
) {
  return state;
}
