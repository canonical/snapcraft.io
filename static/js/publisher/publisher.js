import metrics from './metrics/metrics';
import { selector } from './metrics/filters';
import * as market from './market/market';
import { initMultiselect } from "./form/multiselect";
import { enableInput, changeHandler } from "./settings";

const settings = { enableInput, changeHandler };

export { metrics, selector, market, initMultiselect, settings };
