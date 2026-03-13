import screenshots from "./snap-details/screenshots";
import videos from "./snap-details/videos";
import initExpandableArea from "./expandable-area";
import triggerEventWhenVisible from "./ga-scroll-event";
import initCopyCommand from "./snap-details/copyCommand";
import declareGlobal from "../libs/declare";
import { trackPageView } from "@canonical/analytics-events";

if (window.ANALYTICS_ENDPOINT) {
  trackPageView("snap_distro_install_page");
}

initCopyCommand();

declareGlobal("snapcraft.public.distroInstall", {
  screenshots,
  initExpandableArea,
  triggerEventWhenVisible,
  videos,
});
