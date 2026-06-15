import { Link } from "react-router-dom";
import { Tooltip } from "@canonical/react-components";

import type { ISnap } from "../../types";
import { DEFAULT_ICON_URL } from "../../../config/constants";

function SnapNameEntry({ snap }: { snap: ISnap }): React.JSX.Element {
  const { snapName, status, icon_url } = snap;
  return (
    <Link to={`/${snapName}/listing`} className="p-heading-icon--small">
      <span className="p-heading-icon__header">
        <img
          src={icon_url ? icon_url : DEFAULT_ICON_URL}
          width="32"
          height="32"
          className="p-heading-icon__img"
          alt="snap icon"
        />

        <p className="u-no-margin--bottom">
          {snapName}
          {status === "DisputePending" && (
            <>
              &nbsp;
              <Tooltip message="Name dispute in progress">
                <i className="p-icon--warning"></i>
              </Tooltip>
            </>
          )}
        </p>
      </span>
    </Link>
  );
}

export default SnapNameEntry;
