import { arrayChunk } from "../../libs/arrays";
import { ActiveDevicesGraph } from "./graphs/activeDevicesGraph";
import territoriesMetrics from "./graphs/territories";

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  // Active devices
  let activeDevices = {
    series: [],
    buckets: metrics.activeDevices.metrics.buckets
  };

  metrics.activeDevices.metrics.series.forEach(series => {
    let fullSeries = series.values.map(value => {
      return value === null ? 0 : value;
    });
    activeDevices.series.push({
      name: series.name,
      values: fullSeries
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
      annotations: metrics.activeDevices.annotations
    }
  )
    .prepareData()
    .render()
    .enableTooltip()
    .show();

  // Add hovers for category annotations
  const categories = document.querySelector(`[data-js="annotations-hover"]`);
  if (categories) {
    categories.addEventListener("mouseover", e => {
      const annotationHover = e.target.closest(`[data-js="annotation-hover"]`);
      if (annotationHover) {
        const category = annotationHover.dataset.id;
        graph.g.selectAll(`#${category}`).style("visibility", "visible");
      }
    });

    categories.addEventListener("mouseout", e => {
      const annotationHover = e.target.closest(`[data-js="annotation-hover"]`);
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
function renderPublisherMetrics(options) {
  let first = true;
  const chunkSize = 10;

  const _graph = new ActiveDevicesGraph(
    ".snap-installs-container",
    {},
    {
      stacked: false,
      area: false
    }
  );

  const loader = document.querySelector(".snapcraft-metrics__loader");

  function getSnapDevices(snapList) {
    return new Promise((resolve, reject) => {
      fetch("/snaps/metrics/json", {
        method: "POST",
        body: JSON.stringify(snapList),
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": options.token
        }
      })
        .then(response => {
          if (!response.ok) {
            reject("Could not fetch data.");
          } else {
            return response.json();
          }
        })
        .then(json => {
          const snaps = {
            series: [],
            buckets: json.buckets
          };

          json.snaps.forEach(snap => {
            const continuedDevices = snap.series.filter(
              singleSeries => singleSeries.name === "continued"
            )[0].values;
            const newDevices = snap.series.filter(
              singleSeries => singleSeries.name === "new"
            )[0].values;

            const totalSeries = continuedDevices.map(
              (continuedValue, index) => {
                return continuedValue + newDevices[index];
              }
            );

            snaps.series.push({
              name: snap.name,
              values: totalSeries
            });
          });

          resolve(snaps);
        })
        .catch(reject);
    });
  }

  const snaps_arr = Object.keys(options.snaps).map(key => {
    return {
      name: key,
      id: options.snaps[key]
    };
  });

  const chunkedSnaps = arrayChunk(snaps_arr, chunkSize).map(chunk => {
    const chunkObj = {};

    chunk.forEach(item => {
      chunkObj[item.name] = item.id;
    });

    return chunkObj;
  });

  const toLoad = chunkedSnaps.length;
  let loaded = 0;

  const loaderText = document.createElement("span");
  loaderText.innerText = `${loaded * chunkSize} / ${toLoad * chunkSize}`;
  loader.appendChild(loaderText);

  function getChunk(chunks) {
    if (chunks.length === 0) {
      if (_graph.rawData.buckets.length === 0) {
        document
          .querySelector(`[data-js="dashboard-metrics"]`)
          .classList.add("u-hide");
      } else {
        _graph.enableTooltip();
      }
      return;
    }

    const chunk = chunks.shift();

    loaderText.innerText = `${loaded * chunkSize} / ${toLoad * chunkSize}`;

    getSnapDevices(chunk)
      .then(snaps => {
        if (!first && _graph.rawData) {
          _graph.updateData(snaps).render();
        } else {
          _graph
            .updateData(snaps)
            .render()
            .show();
          first = false;
        }
      })
      .catch(error => {
        throw new Error(error);
      })
      .finally(() => {
        loaded += 1;

        if (loaded === toLoad) {
          loader.parentNode.removeChild(loader);
        }

        getChunk(chunks);
      });
  }

  getChunk(chunkedSnaps);
}

export { renderMetrics, renderPublisherMetrics };
