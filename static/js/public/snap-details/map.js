/* global d3, topojson */

import SnapEvents from '../../libs/events';

export default function renderMap(el, snapData) {
  // Fail fast
  if (!d3) {
    return;
  }
  const mapEl = d3.select(el);

  d3.queue()
    .defer(d3.json, "/static/js/world-110m.v1.json")
    .await(ready);

  function render(mapEl, snapData, world) {
    const width = mapEl.property('clientWidth');
    const height = width * 0.5;
    // some offset position center of the map properly
    const offset = width * 0.1;

    const projection = d3.geoNaturalEarth1()
      .scale(width * 0.2)
      .translate([(width / 2), ((height + offset) / 2) ])
      .precision(.1);

    // rotate not to split Asia
    projection.rotate([-10, 0]);

    const path = d3.geoPath()
      .projection(projection);

    // clean up HTML before rendering map
    mapEl.html('');

    const svg = mapEl.append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = mapEl.append("div")
      .attr("class", "snapcraft-territories__tooltip u-no-margin");

    const tooltipMsg = tooltip.append("div")
      .attr("class", "p-tooltip__message");

    const countries = topojson.feature(world, world.objects.countries).features;

    const g = svg.append("g");
    const country = g.selectAll(".snapcraft-territories__country").data(countries);

    country.enter().insert("path")
      .attr("class", countryData => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          return `snapcraft-territories__country snapcraft-territories__country-default`;
        }

        return 'snapcraft-territories__country';
      })
      .attr("style", countryData => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData){
          if (countrySnapData.color_rgb) {
            return 'fill: rgb(' + countrySnapData.color_rgb[0]+ ',' + countrySnapData.color_rgb[1]+ ',' + countrySnapData.color_rgb[2]+ ')';
          }
        }
      })
      .attr("d", path)
      .attr("id", function(d) {
        return d.id;
      })
      .attr("title", function(d) {
        return d.properties.name;
      })
      .on("mousemove", countryData => {
        const pos = d3.mouse(mapEl.node());
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          tooltip
            .style('top', pos[1] + 'px')
            .style('left', pos[0] + 'px')
            .style('display', 'block');

          let content = ['<span class="u-no-margin--top">', countrySnapData.name];
          if (countrySnapData['number_of_users'] !== undefined) {
            content.push(`<br />${countrySnapData['number_of_users']} active`);
          }
          content.push('</span>');
          tooltipMsg.html(
            `<span
               class="snapcraft-territories__swatch"
               style="background-color: rgb(${countrySnapData.color_rgb[0]}, ${countrySnapData.color_rgb[1]}, ${countrySnapData.color_rgb[2]})"></span>
             ${content.join(' ')}`
          );
        }
      })
      .on("mouseout", function() {
        tooltip.style('display', 'none');
      });

    g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b;
      }))
      .attr("class", "snapcraft-territories__boundary")
      .attr("d", path);
  }

  function ready(error, world) {
    if (error) {
      // let sentry catch it, so we get notified why it fails
      if (error instanceof ProgressEvent) {
        throw new Error(`${error.target.status}: ${error.target.statusText} (${error.target.responseURL})`);
      } else {
        throw new Error(error);
      }
    }

    render(mapEl, snapData, world);

    let resizeTimeout;

    const events = new SnapEvents();

    events.addEvent('resize', window, () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        render(mapEl, snapData, world);
      }, 100);
    });
  }
}
