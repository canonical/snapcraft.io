import { initFSFLanguageSelect } from "./fsf-language-select";
import nps from "./nps";
import initExpandableArea from "./expandable-area";
import declareGlobal from "../libs/declare";

export { initExpandableArea, initFSFLanguageSelect, nps };

declareGlobal("snapcraft.public.homepage", {
  initExpandableArea,
  initFSFLanguageSelect,
  nps,
});
