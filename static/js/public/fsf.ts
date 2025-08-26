import initAccordion from "./accordion";
import { initFSFLanguageSelect } from "./fsf-language-select";
import firstSnapFlow from "./first-snap-flow";
import initExpandableArea from "./expandable-area";
import declareGlobal from "../libs/declare";

declareGlobal("snapcraft.public.fsf", {
  initAccordion,
  initExpandableArea,
  initFSFLanguageSelect,
  firstSnapFlow,
});
