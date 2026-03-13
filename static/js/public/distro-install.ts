import screenshots from "./snap-details/screenshots";
import videos from "./snap-details/videos";
import initExpandableArea from "./expandable-area";
import triggerEventWhenVisible from "./ga-scroll-event";
import initCopyCommand from "./snap-details/copyCommand";
import declareGlobal from "../libs/declare";

initCopyCommand();

declareGlobal("snapcraft.public.distroInstall", {
  screenshots,
  initExpandableArea,
  triggerEventWhenVisible,
  videos,
});
