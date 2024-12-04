import { useState } from "react";
import {
  UseFormGetValues,
  UseFormSetValue,
  UseFormRegister,
  FieldValues,
  UseFieldArrayRemove,
  UseFieldArrayMove,
} from "react-hook-form";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import Screenshot from "./Screenshot";

type Props = {
  screenshots: Array<{ id: string }>;
  screenshotUrls: Array<string>;
  getValues: UseFormGetValues<FieldValues>;
  removeScreenshotUrl: UseFieldArrayRemove;
  setValue: UseFormSetValue<FieldValues>;
  register: UseFormRegister<FieldValues>;
  setImage: (arg: File) => void;
  moveScreenshotUrl: UseFieldArrayMove;
};

function ScreenshotList({
  screenshots,
  screenshotUrls,
  getValues,
  removeScreenshotUrl,
  setValue,
  register,
  setImage,
  moveScreenshotUrl,
}: Props) {
  const [items, setItems] = useState(screenshots);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;

    if (active && over && active?.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      moveScreenshotUrl(oldIndex, newIndex);

      setItems((items) => {
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        <div className="p-listing-images">
          {items.map((field, index) => (
            <Screenshot
              key={field.id}
              field={field}
              index={index}
              screenshotUrls={screenshotUrls}
              getValues={getValues}
              removeScreenshotUrl={removeScreenshotUrl}
              setValue={setValue}
              register={register}
              setImage={setImage}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default ScreenshotList;
