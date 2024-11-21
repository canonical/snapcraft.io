import { bisector } from "d3-array";
import { pointer, select } from "d3-selection";
import { sortChannels } from "../../../../libs/channels";
import { utcFormat } from "d3-time-format";
import { format } from "d3-format";

export function tooltips(this: any) {
  const tooltipTimeFormat = utcFormat("%Y-%m-%d");
  const commaValue = (number: number) => format(",")(number);

  this.showTooltips = false;

  const tooltipTemplate = (dateData: { date: Date }, currentHoverKey: any) => {
    const tooltipRows = (
      dateData: { [x: string]: any; date?: Date },
      currentHoverKey: string,
    ) => {
      const dataArr: {
        skip?: boolean;
        key: any;
        value: any;
        count: any;
      }[] = [];
      let total = 0;
      const other = {
        key: "other",
        value: 0,
        count: 0,
      };

      let keys = Object.keys(dateData).filter((key) => key !== "date");

      if (this.options.graphType && this.options.graphType === "channel") {
        keys = sortChannels(keys, {
          defaultTrack: this.options.defaultTrack
            ? this.options.defaultTrack
            : "latest",
        }).list;
      }

      keys.forEach((key) => {
        total += dateData[key];
        dataArr.push({
          key: key,
          value: dateData[key],
          skip: false,
          count: undefined,
        });
      });

      if (this.options.graphType || this.options.stacked === false) {
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
        .map((item) => {
          if (!item.skip) {
            return [
              `<span class="snapcraft-graph-tooltip__series${
                item.key === currentHoverKey ? " is-hovered" : ""
              }" title="${item.key}">`,
              `<span class="snapcraft-graph-tooltip__series-start">`,
              `<span class="snapcraft-graph-tooltip__series-color"${
                !item.count
                  ? `style="background:${this.colorScale(item.key)};"`
                  : ""
              }></span>`,
              `<span class="snapcraft-graph-tooltip__series-name">${item.key}</span>`,
              `</span>`,
              `<span class="snapcraft-graph-tooltip__series-value">${commaValue(
                item.value,
              )} (${total !== 0 ? ((item.value / total) * 100).toFixed(2) : 0}%)</span>`,
              `</span>`,
            ].join("");
          }

          return "";
        })
        .join("");
    };

    return [
      `<div class="p-tooltip p-tooltip--top-center" style="display: block; pointer-events: none;">`,
      `<span class="p-tooltip__message" role="tooltip" style="display: block;">`,
      `<span class="snapcraft-graph-tooltip__title">${tooltipTimeFormat(
        dateData.date,
      )}</span>`,
      tooltipRows(dateData, currentHoverKey),
      `</span>`,
      `</div>`,
    ].join("");
  };

  const mouseMove = (event: Event, d: { key: any }) => {
    if (!this.showTooltips) {
      return;
    }

    const bisectDate = bisector((d: any) => d.date).left;
    const mousePosition = pointer(event, event.currentTarget);

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
        matchFilter = (item: number[][]) =>
          item[i][0] <= value && item[i][1] >= value;
      } else {
        matchFilter = (item: { values: { value: any }[] }) => {
          const matchValue = item.values[i].value;
          const range = [matchValue / 1.05, matchValue * 1.05];
          return value >= range[0] && value <= range[1];
        };
      }

      const match = this.transformedData
        .filter(matchFilter)
        .map((item: { key: any; name: any }) => item.key || item.name)
        .pop();
      currentHoverKey = match;
    }

    const dateData = this.data[i];

    this.tooltip
      .html(tooltipTemplate(dateData, currentHoverKey))
      .style("top", `${mousePosition[1]}px`)
      .style("left", `${mousePosition[0] + this.margin.left}px`)
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

  this.enableTooltip = () => {
    const dataLayer = select(".layer");

    if (dataLayer.node()) {
      // @ts-ignore
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
        // @ts-ignore
        .on("mousemove", mouseMove.bind(this))
        .on("mouseout", cancelTooltip.bind(this));

      this.showTooltips = true;

      return this;
    }
  };
}
