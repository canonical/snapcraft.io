import { initFSFLanguageSelect } from "./fsf-language-select";
import nps from "./nps";
import initExpandableArea from "./expandable-area";
import declareGlobal from "../libs/declare";
import { trackSearchSubmitted } from "../store/utils/searchTracker";

function initHomeSearchTracking(): void {
  const form = document.querySelector(
    "[data-js='home-search-form']",
  ) as HTMLFormElement | null;

  if (form) {
    form.addEventListener(
      "submit",
      () => {
        const input = form.querySelector("input[name='q']") as HTMLInputElement;
        if (input?.value) {
          trackSearchSubmitted("home");
        }
      },
      { once: true },
    );
  }
}

declareGlobal("snapcraft.public.homepage", {
  initExpandableArea,
  initFSFLanguageSelect,
  initHomeSearchTracking,
  nps,
});
