import { useRef } from "react";

import { useDragging, DND_ITEM_REVISIONS } from "../dnd";

import { getRevisionsArchitectures } from "../../helpers";
import ReleasesTableChannelHeading from "./channelHeading";

// generic releases table row component
const ReleasesTableRow = ({
  canDrag = true,
  risk,
  branch,
  revisions,
  canDrop,
  children,
}: {
  canDrag: boolean;
  risk?: any;
  branch?: any;
  revisions?: any;
  canDrop?: any;
  children?: any;
}) => {
  const _canDrag = !!revisions && canDrag;

  const draggedRevisions = _canDrag ? Object.values(revisions) : [];

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revisions: draggedRevisions,
      architectures: getRevisionsArchitectures(draggedRevisions),
      risk,
      branch: branch ? branch.branch : null,
      type: DND_ITEM_REVISIONS,
    },
    canDrag: _canDrag,
  });

  const tableRow: any = useRef(null);

  return (
    <div
      ref={tableRow}
      className={`p-releases-table__row p-releases-table__row--${
        branch ? "branch" : "channel"
      } p-releases-table__row--${risk} ${isDragging ? "is-dragging" : ""} ${
        isGrabbing ? "is-grabbing" : ""
      } ${canDrop ? "can-drop" : ""}`}
      onMouseEnter={(e) => {
        const target = e.target as HTMLElement;
        const parentNode = target.parentNode as HTMLElement;
        if (parentNode) {
          if (!parentNode.classList.contains("p-releases-table__cell")) {
            if (tableRow.current) {
              tableRow.current.classList.add("is-hovered");
            }
          }
        }
      }}
      onMouseLeave={() => {
        if (tableRow.current) {
          tableRow.current.classList.remove("is-hovered");
        }
      }}
    >
      <ReleasesTableChannelHeading
        drag={drag}
        risk={risk}
        branch={branch}
        revisions={revisions}
      />
      {children}
    </div>
  );
};

export default ReleasesTableRow;
