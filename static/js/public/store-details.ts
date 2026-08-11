import map from "./snap-details/map";
import screenshots from "./snap-details/screenshots";
import channelMap from "./snap-details/channelMap";
import videos from "./snap-details/videos";
import initReportSnap from "./snap-details/reportSnap";
import initEmbeddedCardModal from "./snap-details/embeddedCard";
import initAuditableBadge from "./snap-details/auditableBadge";
import initSecurityTab from "./snap-details/securityTab";
import initDetailsTabs from "./snap-details/detailsTabs";
import { snapDetailsPosts } from "./snap-details/blog-posts";
import initExpandableArea from "./expandable-area";
import initCopyCommand from "./snap-details/copyCommand";
import declareGlobal from "../libs/declare";

initCopyCommand();

declareGlobal("snapcraft.public.storeDetails", {
  map,
  screenshots,
  channelMap,
  snapDetailsPosts,
  initEmbeddedCardModal,
  initAuditableBadge,
  initSecurityTab,
  initDetailsTabs,
  initExpandableArea,
  initReportSnap,
  videos,
});
