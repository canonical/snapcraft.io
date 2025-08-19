import { initFSFLanguageSelect } from "../fsf-language-select";
import initExpandableArea from "../expandable-area";
import declareGlobal from "../../libs/declare";

declareGlobal("snapcraft.about", { initFSFLanguageSelect, initExpandableArea });
