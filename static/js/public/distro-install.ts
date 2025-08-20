import screenshots from "./snap-details/screenshots";
import videos from "./snap-details/videos";
import initExpandableArea from "./expandable-area";
import triggerEventWhenVisible from "./ga-scroll-event";
import declareGlobal from "../libs/declare";

declareGlobal("snapcraft.public.distroInstall", {
  screenshots,
  initExpandableArea,
  triggerEventWhenVisible,
  videos,
});
