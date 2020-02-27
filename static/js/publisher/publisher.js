import * as metrics from "./metrics/metrics";
import { selector } from "./metrics/filters";
import * as market from "./form";
import { initMultiselect } from "./form/multiselect";
import { initRepoConnect } from "./builds/components/repoConnect";
import { enableInput, changeHandler } from "./settings";
import * as publicise from "./publicise";
import { initCategories } from "./market/categories";
import markdownToggle from "./market/markdown";
import stickyListingBar from "./market/stickyListingBar";
import { preview } from "./preview";
import submitEnabler from "./submitEnabler";
import * as tour from "./tour";
import { initBuilds } from "./builds";

const settings = { enableInput, changeHandler };

export {
  initCategories,
  initMultiselect,
  initRepoConnect,
  markdownToggle,
  metrics,
  market,
  publicise,
  selector,
  stickyListingBar,
  settings,
  preview,
  submitEnabler,
  tour,
  initBuilds
};
