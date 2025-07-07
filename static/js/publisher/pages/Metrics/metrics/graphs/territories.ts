import map from "../../../../../public/snap-details/map";

import type { TerritoriesMetricsData } from "../../../../types/shared";

export default function (el: string, data: TerritoriesMetricsData) {
  map(el, data);
}
