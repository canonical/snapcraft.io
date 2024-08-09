import { select, pointer, Selection, BaseType } from "d3-selection";
import { json } from "d3-fetch";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

import SnapEvents from "../../libs/events";
import { GeoJsonProperties } from "geojson";
import { Topology, Objects } from "topojson-specification";

export default function renderMap(
  el: string,
  snapData: {
    [key: number]: {
      code: string;
      color_rgb: number[];
      name: string;
      number_of_users: number;
      percentage_of_users: number;
    };
  }
) {
  const mapEl = select(el);

  json("/static/js/world-110m.v1.json")
    // @ts-expect-error
    .then(ready)
    .catch((error) => {
      throw new Error(error);
    });

  function render(
    mapEl: Selection<BaseType, unknown, HTMLElement, unknown>,
    snapData: {
      [key: number]: {
        code: string;
        color_rgb: number[];
        name: string;
        number_of_users: number;
        percentage_of_users: number;
      };
    },
    world: Topology<Objects<GeoJsonProperties>>
  ) {
    const width = mapEl.property("clientWidth");
    const height = width * 0.5;
    // some offset position center of the map properly
    const offset = width * 0.1;

    const projection = geoNaturalEarth1()
      .scale(width * 0.2)
      .translate([width / 2, (height + offset) / 2])
      .precision(0.1);

    // rotate not to split Asia
    projection.rotate([-10, 0]);

    const path = geoPath().projection(projection);

    // clean up HTML before rendering map
    mapEl.html("");

    const svg = mapEl.append("svg").attr("width", width).attr("height", height);

    const tooltip = mapEl
      .append("div")
      .attr("class", "snapcraft-territories__tooltip u-no-margin");

    const tooltipMsg = tooltip
      .append("div")
      .attr("class", "p-tooltip__message");

    // @ts-expect-error
    const countries = feature(world, world.objects.countries).features;

    const g = svg.append("g");
    const country: Selection<
      BaseType,
      {
        geometry: {
          type: string;
          coordinates: Array<Array<number>>;
        };
        id: number;
        properties: {};
        type: string;
      },
      SVGGElement,
      unknown
    > = g.selectAll(".snapcraft-territories__country").data(countries);

    country
      .enter()
      .insert("path")
      .attr("class", (countryData) => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          return `snapcraft-territories__country snapcraft-territories__country-default`;
        }

        return "snapcraft-territories__country";
      })
      // @ts-expect-error
      .attr("style", (countryData) => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          if (countrySnapData.color_rgb) {
            return (
              "fill: rgb(" +
              countrySnapData.color_rgb[0] +
              "," +
              countrySnapData.color_rgb[1] +
              "," +
              countrySnapData.color_rgb[2] +
              ")"
            );
          }
        }
      })
      // @ts-expect-error
      .attr("d", path)
      .attr("id", function (d) {
        return d.id;
      })
      .attr("title", function (d) {
        // @ts-expect-error
        return d.properties.name;
      })
      .on("mousemove", (event) => {
        const pos = pointer(event, event.currentTarget);
        const countrySnapData = snapData[event.currentTarget.id];

        if (countrySnapData) {
          tooltip
            .style("top", pos[1] + "px")
            .style("left", pos[0] + "px")
            .style("display", "block");

          let content = [
            '<span class="u-no-margin--top">',
            countrySnapData.name,
          ];
          if (countrySnapData["number_of_users"] !== undefined) {
            content.push(`<br />${countrySnapData["number_of_users"]} active`);
          }
          content.push("</span>");
          tooltipMsg.html(
            `<span
               class="snapcraft-territories__swatch"
               style="background-color: rgb(${countrySnapData.color_rgb[0]}, ${
                 countrySnapData.color_rgb[1]
               }, ${countrySnapData.color_rgb[2]})"></span>
             ${content.join(" ")}`
          );
        }
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
      });

    g.append("path")
      .datum(
        // @ts-expect-error
        mesh(world, world.objects.countries, function (a, b) {
          return a !== b;
        })
      )
      .attr("class", "snapcraft-territories__boundary")
      .attr("d", path);
  }

  function ready(world: Topology<Objects<GeoJsonProperties>>) {
    render(mapEl, snapData, world);

    let resizeTimeout: string | number | NodeJS.Timeout | undefined;

    // @ts-expect-error
    const events = new SnapEvents();

    events.addEvent("resize", window, () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        render(mapEl, snapData, world);
      }, 100);
    });
  }
}
