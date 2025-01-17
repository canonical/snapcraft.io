import { arrayChunk } from "./arrays";
import { ActiveDevicesGraph } from "./graphs/activeDevicesGraph/";
import territoriesMetrics from "./graphs/territories";

type Series = {
  name: string;
  values: Array<number>;
};

type ActiveDeviceMetric = {
  metrics: {
    buckets: Array<string>;
    series: Array<Series>;
  };
  selector: string;
  type: string;
};

type TerritoriesMetric = {
  metrics: {
    [key: string]: {
      code: string;
      color_rgb: string;
      name: string;
      number_of_users: number;
      percentage_of_users: number;
    };
  };
  selector: string;
};

function renderActiveDevicesMetrics(metrics: ActiveDeviceMetric) {
  const activeDevices: {
    series: Array<Series>;
    buckets: Array<string>;
  } = {
    series: [],
    buckets: metrics.metrics.buckets,
  };

  metrics.metrics.series.forEach((series) => {
    const fullSeries = series.values.map((value) => {
      return value === null ? 0 : value;
    });
    activeDevices.series.push({
      name: series.name,
      values: fullSeries,
    });
  });

  const graph = new ActiveDevicesGraph(metrics.selector, activeDevices, {
    stacked: true,
    area: true,
    graphType: metrics.type,
  })
    .render()
    // @ts-ignore
    .enableTooltip()
    .show();

  // Add hovers for category annotations
  const categories = document.querySelector(`[data-js="annotations-hover"]`);
  if (categories) {
    categories.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      const annotationHover = target.closest(
        `[data-js="annotation-hover"]`
      ) as HTMLElement;
      if (annotationHover) {
        const category = annotationHover.dataset.id;
        graph.g.selectAll(`#${category}`).style("visibility", "visible");
      }
    });

    categories.addEventListener("mouseout", (e) => {
      const target = e.target as HTMLElement;
      const annotationHover = target.closest(
        `[data-js="annotation-hover"]`
      ) as HTMLElement;
      if (annotationHover) {
        const category = annotationHover.dataset.id;
        graph.g.selectAll(`#${category}`).style("visibility", "hidden");
      }
    });
  }
}

function renderTerritoriesMetrics(metrics: TerritoriesMetric) {
  territoriesMetrics(metrics.selector, metrics.metrics);
}

/**
 * Render publisher page metrics
 * @param {Object} options An object with rendering options.
 */
function renderPublisherMetrics(options: {
  snaps: {
    series: Array<Series>;
    buckets: Array<string>;
  };
}) {
  const _graph = new ActiveDevicesGraph(
    ".snap-installs-container",
    {},
    {
      stacked: false,
      area: false,
    }
  );
  _graph.updateData(options.snaps).render().show();
  _graph.enableTooltip();
}

export {
  renderActiveDevicesMetrics,
  renderPublisherMetrics,
  renderTerritoriesMetrics,
};
