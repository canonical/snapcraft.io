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

import {
  Strip,
  Row,
  Col,
  Button,
  Icon,
  Spinner,
} from "@canonical/react-components";

import { LoadingCard } from "@canonical/store-components";

import { SortableCard, FindSnap } from "../components/index";

import type { SnapData } from "../types/SnapData";

const fetchFeaturedSnaps = async () => {
  const headers = new Headers();
  headers.append("pragma", "no-cache");
  headers.append("cache-control", "no-cache");
  const response = await fetch("/admin-dashboard/api/featured-snaps", {
    method: "GET",
    headers,
  });
  return response.json();
};

function FeaturedSnaps() {
  const [isSaving, setIsSaving] = useState(false);
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

  const handleRemove = (id: string) => {
    setFeatured((items: SnapData[]) => {
      const index = items.findIndex((item) => item.package_name === id);
      return [...items.slice(0, index), ...items.slice(index + 1)];
    });
  };

  const handleAdd = (snap: any) => {
    const transformedSnap: SnapData = {
      sections: snap.categories,
      summary: snap.package.description,
      title: snap.package.display_name,
      icon_url: snap.package.icon_url,
      package_name: snap.package.name,
      developer_name: snap.publisher.display_name,
      origin: snap.publisher.name,
      developer_validation:
        snap.publisher.validation === "starred"
          ? "star"
          : snap.publisher.validation,
    };
    setFeatured((items: SnapData[]) => {
      if (items) {
        return [transformedSnap, ...items];
      }

      return [transformedSnap];
    });
  };

  const handleSave = async (event: any) => {
    event.preventDefault();
    const data = new FormData();
    data.append("snaps", featured.map((snap) => snap.package_name).join(","));
    data.append("csrf_token", window.CSRF_TOKEN);

    setIsSaving(true);

    const response = await fetch("/admin-dashboard/api/featured-snaps", {
      method: "POST",
      body: data,
    });

    setIsSaving(false);

    if (!response.ok) {
      console.error("Something went wrong");
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <h1>Featured Snaps</h1>
        <FindSnap addSnap={handleAdd} />
      </div>
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
                <SortableCard
                  key={snap.package_name}
                  snap={snap}
                  handleRemove={handleRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        <p style={{ textAlign: "right", maxWidth: "100%" }}>
          {featured.length < 16 && (
            <>Please add {16 - featured.length} more snaps to save</>
          )}
          <Button
            appearance="positive"
            onClick={handleSave}
            disabled={featured.length < 16}
            hasIcon={isSaving}
            inline
          >
            {isSaving ? (
              <>
                <Spinner isLight /> <span>Saving</span>
              </>
            ) : (
              "Save"
            )}
          </Button>
        </p>
      </Row>
    </Strip>
  );
}

export default FeaturedSnaps;
