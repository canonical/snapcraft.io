import { createNav } from "@canonical/global-nav";

window.addEventListener("DOMContentLoaded", function () {
  createNav({ isSliding: true, closeMenuAnimationDuration: 200 });
});
