import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { Strip, Row, Col, Button, Icon } from "@canonical/react-components";

import { LoadingCard } from "@canonical/store-components";

import { SortableCard } from "../components/index";

import type { SnapData } from "../types/SnapData";

const fetchFeaturedSnaps = async () => {
  const response = await fetch("/admin-dashboard/api/featured-snaps");
  return response.json();
};

function FeaturedSnaps() {
  const [featured, setFeatured] = useState<SnapData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;

    if (active.id !== over.id) {
      setFeatured((items: SnapData[]) => {
        if (items) {
          const oldIndex = items.findIndex(
            (item) => item.package_name === active.id,
          );
          const newIndex = items.findIndex(
            (item) => item.package_name === over.id,
          );

          return arrayMove(items, oldIndex, newIndex);
        }

        return items;
      });
    }
  };

  const { data, isLoading, isError } = useQuery(
    "featuredSnaps",
    fetchFeaturedSnaps,
  );

  useEffect(() => {
    if (data) {
      setFeatured(data);
    }
  }, [data]);

  return (
    <Strip>
      <h1>FeaturedSnaps</h1>
      <Row>
        {isLoading &&
          [...Array(16)].map((item, index) => (
            <Col size={3} key={index}>
              <LoadingCard />
            </Col>
          ))}
        {isError && <div>Error</div>}
        {featured && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={featured.map((snap) => snap.package_name)}
              strategy={rectSortingStrategy}
            >
              {featured.map((snap: any) => (
                <SortableCard key={snap.package_name} snap={snap} />
              ))}
            </SortableContext>
          </DndContext>
        )}
        <Button>Add</Button>
      </Row>
    </Strip>
  );
}

export default FeaturedSnaps;
