import { useRef } from "react";

import { useDragging, DND_ITEM_REVISIONS } from "../dnd";

import { getRevisionsArchitectures } from "../../helpers";
import ReleasesTableChannelHeading from "./channelHeading";
import { ArchitectureRevisionsMap, Revision } from "../../../../types/releaseTypes";

// Type for branch object based on usage
interface Branch {
  branch: string;
}

// Type for draggedItem based on usage in other components
interface DraggedItem {
  revisions: Revision[];
  architectures: string[];
  risk?: string;
  branch: string | null;
  type: string;
}

interface ReleasesTableRowProps {
  canDrag?: boolean;
  risk?: string;
  branch?: Branch;
  revisions?: ArchitectureRevisionsMap;
  canDrop?: boolean;
  children?: React.ReactNode;
  isOverParent?: boolean; // Passed to children but not used in this component
  draggedItem?: DraggedItem; // Passed to children but not used in this component
}

// generic releases table row component
const ReleasesTableRow = ({
  canDrag = true,
  risk,
  branch,
  revisions,
  canDrop,
  children,
}: ReleasesTableRowProps) => {
  canDrag = !!revisions && canDrag;

  const draggedRevisions = canDrag ? Object.values(revisions) : [];

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revisions: draggedRevisions,
      architectures: getRevisionsArchitectures(draggedRevisions),
      risk,
      branch: branch ? branch.branch : null,
      type: DND_ITEM_REVISIONS,
    },
    canDrag,
  });

  const tableRow = useRef<HTMLDivElement>(null);

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
