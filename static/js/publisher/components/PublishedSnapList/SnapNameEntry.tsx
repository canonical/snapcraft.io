import { Link } from "react-router-dom";
import { withTooltip, Icon } from "@canonical/react-ds-global";

import type { ISnap } from "../../types";
import { DEFAULT_ICON_URL } from "../../../config/constants";

function SnapNameEntry({ snap }: { snap: ISnap }): React.JSX.Element {
  const { snapName, status, icon_url } = snap;

  const WarningTooltip = withTooltip(Icon, "Name dispute in progress");

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
              <WarningTooltip icon="warning" />
            </>
          )}
        </p>
      </span>
    </Link>
  );
}

export default SnapNameEntry;
