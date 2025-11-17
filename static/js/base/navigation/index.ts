// This same code can be found duplicated in charmhub.io
// If you modify these files for some reason it is likely that you will also need to modify charmhub.io's ones

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
