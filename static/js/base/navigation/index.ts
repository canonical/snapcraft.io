import "./login";

import { createNav as createAllCanonicalLink } from "@canonical/global-nav";
import { initNavigationListeners } from "./listeners";
import { patchAllCanonicalMobile } from "./globalNav";

// initialize global-nav ("All Canonical" link) and the rest of the navigation
window.addEventListener("DOMContentLoaded", function () {
  createAllCanonicalLink();
  patchAllCanonicalMobile();
  initNavigationListeners();
});
