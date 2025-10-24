import "./login";

import { createNav as createAllCanonicalNav } from "@canonical/global-nav";
import { initNavigationListeners } from "./listeners";
import { patchAllCanonicalMobileMarkup } from "./globalNav";

// initialize global-nav ("All Canonical" link) and the rest of the navigation
window.addEventListener("DOMContentLoaded", function () {
  createAllCanonicalNav();
  patchAllCanonicalMobileMarkup();
  initNavigationListeners();
});
