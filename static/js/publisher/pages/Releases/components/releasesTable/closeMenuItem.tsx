import { connect } from "react-redux";

import { closeRevision } from "../../slices/pendingChanges";
import type {
  Revision,
  CPUArchitecture,
} from "../../../../types/releaseTypes";
import type { AppDispatch } from "../../store";
import type { DraggedItem } from "./types";

interface OwnProps {
  item: DraggedItem;
  current?: string;
  arch?: CPUArchitecture;
}

interface DispatchProps {
  closeRevision: (revision: Revision, targetChannel: string, arch: CPUArchitecture) => void;
}

type ReleaseMenuItemProps = OwnProps & DispatchProps;

function CloseMenuItem(props: ReleaseMenuItemProps) {
  return (props.current && props.arch &&
    <span className="p-contextual-menu__group">
      <a
        className="p-contextual-menu__link"
        href="#"
        onClick={() => {
          const revision = props.item.revisions.find(() => true);
          if (revision) {
            props.closeRevision(
              revision,
              props.current!,
              props.arch!,
            );
          }
        }}
      >
        Close {props.arch}
      </a>
    </span>
  );
}

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => {
  return {
    closeRevision: (revision: Revision, targetChannel: string, arch: CPUArchitecture) =>
      dispatch(closeRevision(
        revision,
        targetChannel,
        arch,
      )),
  };
};

export default connect(null, mapDispatchToProps)(CloseMenuItem);
