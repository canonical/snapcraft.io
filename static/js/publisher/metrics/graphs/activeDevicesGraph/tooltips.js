import { bisector } from "d3-array";
import { mouse, select } from "d3-selection";
import { sortChannels } from "../../../../libs/channels";
import { utcFormat } from "d3-time-format";
import { format } from "d3-format";

export function tooltips() {
  const tooltipTimeFormat = utcFormat("%Y-%m-%d");
  const commaValue = number => format(",")(number);

  this.showTooltips = false;

  const tooltipTemplate = (dateData, currentHoverKey) => {
    const tooltipRows = (dateData, currentHoverKey) => {
      let dataArr = [];
      let other = {
        key: "other",
        value: 0,
        count: 0
      };

      let keys = Object.keys(dateData).filter(key => key !== "date");

      if (this.options.graphType && this.options.graphType === "channel") {
        keys = sortChannels(keys, {
          defaultTrack: this.options.metricsDefaultTrack
            ? this.options.metricsDefaultTrack
            : "latest"
        }).list;
      }

      keys.forEach(key => {
        dataArr.push({
          key: key,
          value: dateData[key]
        });
      });

      if (
        (this.options.graphType && this.options.graphType !== "channel") ||
        this.options.stacked === false
      ) {
        dataArr.sort((a, b) => b.value - a.value);
      }

      if (dataArr.length > 15) {
        dataArr.forEach((item, index) => {
          if (index >= 15) {
            other.value += item.value;
            other.count += 1;
            other.key = `${other.count} other`;
            item.skip = true;
          }
        });
      }

      // If we've added anything to the 'other' series,
      // add it to the array
      if (other.value > 0) {
        dataArr.push(other);
      }

      return dataArr
        .map(item => {
          if (!item.skip) {
            return [
              `<span class="snapcraft-graph-tooltip__series${
                item.key === currentHoverKey ? " is-hovered" : ""
              }" title="${item.key}">`,
              `<span class="snapcraft-graph-tooltip__series-name">${
                item.key
              }</span>`,
              `<span class="snapcraft-graph-tooltip__series-color"${
                !item.count
                  ? `style="background:${this.colorScale(item.key)};"`
                  : ""
              }></span>`,
              `<span class="snapcraft-graph-tooltip__series-value">${commaValue(
                item.value
              )}</span>`,
              `</span>`
            ].join("");
          }
        })
        .join("");
    };

    return [
      `<div class="p-tooltip p-tooltip--top-center" style="display: block; pointer-events: none;">`,
      `<span class="p-tooltip__message" role="tooltip" style="display: block;">`,
      `<span class="snapcraft-graph-tooltip__title">${tooltipTimeFormat(
        dateData.date
      )}</span>`,
      tooltipRows(dateData, currentHoverKey),
      `</span>`,
      `</div>`
    ].join("");
  };

  const mouseMove = (d, index, nodes) => {
    if (!this.showTooltips) {
      return;
    }
    const bisectDate = bisector(d => d.date).left;

    const node = nodes[index];
    const mousePosition = mouse(node);

    const x0 = this.xScale.invert(mousePosition[0]);
    const _date = new Date(x0);
    _date.setHours(_date.getHours() - 12);
    _date.setMinutes(0);
    _date.setSeconds(0);
    _date.setMilliseconds(0);
    const i = bisectDate(this.data, _date.getTime(), 0);

    const y0 = this.yScale.invert(mousePosition[1]);
    const value = Math.round(y0);

    let currentHoverKey;
    if (d) {
      currentHoverKey = d.key;
    } else {
      let matchFilter;
      if (this.options.stacked) {
        matchFilter = item => item[i][0] <= value && item[i][1] >= value;
      } else {
        matchFilter = item => {
          const matchValue = item.values[i].value;
          const range = [matchValue / 1.05, matchValue * 1.05];
          return value >= range[0] && value <= range[1];
        };
      }

      const match = this.transformedData
        .filter(matchFilter)
        .map(item => item.key || item.name)
        .pop();
      currentHoverKey = match;
    }

    const dateData = this.data[i];

    this.tooltip
      .html(tooltipTemplate(dateData, currentHoverKey))
      .style("top", `${mousePosition[1]}px`)
      .style(
        "left",
        `${mousePosition[0] + this.margin.left + this.padding.left}px`
      )
      .style("display", "block");

    const tooltipBounding = this.tooltip
      .select(".p-tooltip__message")
      .node()
      .getBoundingClientRect();

    if (tooltipBounding.top < 0) {
      this.tooltip
        .select(".p-tooltip")
        .classed("p-tooltip--top-center", false)
        .classed("p-tooltip--btm-center", true);

      this.tooltip.style("top", `${mousePosition[1] + 30}px`);
    }
  };

  const cancelTooltip = () => {
    this.tooltip.style("display", "none");
  };

  /**
   *
   * @returns {tooltips}
   */
  this.enableTooltip = () => {
    const dataLayer = select(".layer");
    const dataLayerBox = dataLayer.node().getBBox();

    dataLayer
      .append("rect")
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr("class", "pointerLayer")
      .attr("width", dataLayerBox.width)
      .attr("height", dataLayerBox.height + this.margin.top)
      .attr("x", dataLayerBox.x)
      .attr("y", dataLayerBox.y - this.margin.top / 2)
      .on("mousemove", mouseMove.bind(this))
      .on("mouseout", cancelTooltip.bind(this));

    this.showTooltips = true;

    return this;
  };
}
