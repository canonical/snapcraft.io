import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Col, Icon } from "@canonical/react-components";

import { DefaultCard } from "@canonical/store-components";

import type { SnapData } from "../types/SnapData";

type SortableCardProps = {
  snap: SnapData;
};

const SortableCard = ({ snap }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: snap.package_name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Col size={3} style={{ marginBottom: "1.5rem", position: "relative" }}>
      <div style={{ ...style }} ref={setNodeRef} {...listeners} {...attributes}>
        <Icon
          style={{
            position: "absolute",
            top: ".5rem",
            right: ".5rem",
          }}
          name="delete"
        />
        <Icon
          style={{
            position: "absolute",
            top: ".5rem",
            left: ".5rem",
          }}
          name="drag"
        />
        <DefaultCard
          data={{
            categories: snap.sections,
            package: {
              description: snap.summary,
              display_name: snap.title,
              icon_url: snap.icon_url,
              name: snap.package_name,
            },
            publisher: {
              display_name: snap.developer_name,
              name: snap.origin,
              validation:
                snap.developer_validation === "starred"
                  ? "star"
                  : snap.developer_validation,
            },
          }}
        />
      </div>
    </Col>
  );
};

export default SortableCard;
