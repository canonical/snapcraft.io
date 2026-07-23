import map from "./snap-details/map";
import screenshots from "./snap-details/screenshots";
import channelMap from "./snap-details/channelMap";
import videos from "./snap-details/videos";
import initReportSnap from "./snap-details/reportSnap";
import initEmbeddedCardModal from "./snap-details/embeddedCard";
import { snapDetailsPosts } from "./snap-details/blog-posts";
import initExpandableArea from "./expandable-area";
import initCopyCommand from "./snap-details/copyCommand";
import { applyDesktopStoreSupport } from "./snap-details/openDesktop";
import declareGlobal from "../libs/declare";

initCopyCommand();
applyDesktopStoreSupport();

declareGlobal("snapcraft.public.storeDetails", {
  map,
  screenshots,
  channelMap,
  snapDetailsPosts,
  initEmbeddedCardModal,
  initExpandableArea,
  initReportSnap,
  videos,
});
