import { arrayChunk } from "../../libs/arrays";
import { ActiveDevicesGraph } from "./graphs/activeDevicesGraph/";
import territoriesMetrics from "./graphs/territories";

type Series = {
  name: string;
  values: Array<number>;
};

type Metrics = {
  activeDevices: {
    annotations: {
      buckets: Array<string>;
      name: string;
      series: Array<Series>;
    };
    metrics: {
      buckets: Array<string>;
      series: Array<Series>;
    };
    selector: string;
    type: string;
  };
  defaultTrack: string;
  territories: {
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
};

function renderMetrics(metrics: Metrics) {
  let activeDevices: {
    series: Array<Series>;
    buckets: Array<string>;
  } = {
    series: [],
    buckets: metrics.activeDevices.metrics.buckets,
  };

  metrics.activeDevices.metrics.series.forEach((series) => {
    let fullSeries = series.values.map((value) => {
      return value === null ? 0 : value;
    });
    activeDevices.series.push({
      name: series.name,
      values: fullSeries,
    });
  });

  const graph = new ActiveDevicesGraph(
    metrics.activeDevices.selector,
    activeDevices,
    {
      stacked: true,
      area: true,
      graphType: metrics.activeDevices.type,
      defaultTrack: metrics.defaultTrack,
      annotations: metrics.activeDevices.annotations,
    }
  )
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

  // Territories
  territoriesMetrics(metrics.territories.selector, metrics.territories.metrics);
}

/**
 * Render publisher page metrics
 * @param {Object} options An object with rendering options.
 */
function renderPublisherMetrics(options: {
  token: string;
  snaps: {
    [key: string]: any;
  };
}) {
  let first = true;
  const chunkSize = 10;

  const _graph = new ActiveDevicesGraph(
    ".snap-installs-container",
    {},
    {
      stacked: false,
      area: false,
    }
  );

  const loader = document.querySelector(
    ".snapcraft-metrics__loader"
  ) as HTMLElement;

  function getSnapDevices(snapList: any) {
    return new Promise((resolve, reject) => {
      fetch("/snaps/metrics/json", {
        method: "POST",
        body: JSON.stringify(snapList),
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": options.token,
        },
      })
        .then((response) => {
          if (!response.ok) {
            return reject("Could not fetch data.");
          } else {
            return response.json();
          }
        })
        .then((json) => {
          const snaps: {
            series: Array<Series>;
            buckets: Array<string>;
          } = {
            series: [],
            buckets: json.buckets,
          };

          json.snaps.forEach(
            (snap: { series: Array<Series>; name: string }) => {
              const continuedDevices = snap.series.filter(
                (singleSeries) => singleSeries.name === "continued"
              )[0];
              const newDevices = snap.series.filter(
                (singleSeries) => singleSeries.name === "new"
              )[0];

              let totalSeries: Array<number> = [];

              if (continuedDevices && newDevices) {
                totalSeries = continuedDevices.values.map(
                  (continuedValue, index) => {
                    return continuedValue + newDevices.values[index];
                  }
                );
              } else {
                console.log(
                  "There is no information available for continued or new devices.",
                  snap.series
                );
              }

              snaps.series.push({
                name: snap.name,
                values: totalSeries,
              });
            }
          );

          resolve(snaps);
        })
        .catch(reject);
    });
  }

  const snaps_arr: Array<{ name: string; id: string }> = Object.keys(
    options.snaps
  ).map((key) => {
    return {
      name: key,
      id: options.snaps[key],
    };
  });

  const chunkedSnaps = arrayChunk(snaps_arr, chunkSize).map((chunk) => {
    const chunkObj: { [key: string]: string } = {};

    chunk.forEach((item: { name: string; id: string }) => {
      chunkObj[item.name] = item.id;
    });

    return chunkObj;
  });

  const toLoad = chunkedSnaps.length;
  let loaded = 0;

  const loaderText = document.createElement("span");
  loaderText.innerText = `${loaded * chunkSize} / ${toLoad * chunkSize}`;
  loader.appendChild(loaderText);

  function getChunk(chunks: Array<any>) {
    if (chunks.length === 0) {
      if (
        !_graph ||
        !_graph.rawData ||
        !_graph.rawData.buckets ||
        _graph.rawData.buckets.length === 0
      ) {
        const dashboardMetrics = document.querySelector(
          `[data-js="dashboard-metrics"]`
        ) as HTMLElement;

        dashboardMetrics.classList.add("u-hide");
      } else {
        // @ts-ignore
        _graph.enableTooltip();
      }
      return;
    }

    const chunk = chunks.shift();

    loaderText.innerText = `${loaded * chunkSize} / ${toLoad * chunkSize}`;

    getSnapDevices(chunk)
      .then((snaps) => {
        if (!first && _graph.rawData) {
          _graph.updateData(snaps).render();
        } else {
          _graph.updateData(snaps).render().show();
          first = false;
        }
      })
      .catch((error) => {
        throw new Error(error);
      })
      .finally(() => {
        loaded += 1;

        if (loaded === toLoad && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }

        getChunk(chunks);
      });
  }

  getChunk(chunkedSnaps);
}

export { renderMetrics, renderPublisherMetrics };
