import "./polyfills";
import "./dropdown-menu-toggle";
import "./notification-dismiss";
import "./ga";

import { createNav } from "@canonical/global-nav";
createNav({
  maxWidth: "72rem",
  showLogins: false
});
