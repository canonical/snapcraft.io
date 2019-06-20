import { select } from "d3-selection";
import { format } from "d3-format";
import { area, curveMonotoneX, line } from "d3-shape";
import debounce from "../../../../libs/debounce";
import { arraysMerge } from "../../../../libs/arrays";

import {
  prepareStackedData,
  prepareLineData,
  prepareScales,
  prepareAnnotationsData,
  prepareAxis
} from "./dataProcessing";
import {
  renderXAxis,
  renderYAxis,
  renderBars,
  // renderArea,
  renderLines,
  renderAnnotations
} from "./rendering";
import { tooltips } from "./tooltips";

class ActiveDevicesGraph {
  /**
   *
   * @param {string} holderSelector CSS selector for the element containing the graph
   * @param {object} rawData
   * @param {string[]} rawdata.buckets The list of dates in the format YYYY-MM-DD
   * @param {{name: string, values: number[]}[]} rawData.series The different series to show on the graph
   * @param {object} options
   * @param {boolean} options.area Whether to use graph areas
   * @param {boolean} options.stacked Whether to stack the data
   * @param {string} options.graphType If 'channel' items will be sorted by risk
   * @param {string} options.defaultTrack The default track
   * @param {object} options.annotations Annotations series
   * @param {string[]} options.annotations.buckets The list of date in the format YYYY-MM-DD
   * @param {string} options.annotations.name The name of the series
   * @param {{date: string, display_date: string, display_name: string, name: string, values: number[]}} options.annotations.series
   */
  constructor(holderSelector, rawData, options) {
    this.holder = document.querySelector(holderSelector);
    if (!this.holder) {
      throw new Error(`${holderSelector} does not exist.`);
    }
    this.rawData = rawData;
    this.options = Object.assign({}, options);

    this.margin = Object.assign(
      {
        top: 20,
        right: 0,
        bottom: 30,
        left: 50
      },
      options.margin || {}
    );

    this.padding = Object.assign(
      {
        top: 0,
        right: 0,
        bottom: 16,
        left: 16
      },
      options.padding || {}
    );

    this.width;
    this.height;

    this.svg = select(`${holderSelector} svg`);
    this.g = undefined;

    this.transformedData = undefined;
    this.annotationsData = undefined;
    this.data = undefined;
    this.keys = undefined;
    this.maxYValue = undefined;

    this.xScale = undefined;
    this.yScale = undefined;
    this.colorScale = undefined;

    this.xAxis = undefined;
    this.yAxis = undefined;
    this.xAxisTickFormat = undefined;

    this.hasRendered = false;

    this.lines = line()
      .curve(curveMonotoneX)
      .x(d => this.xScale(d.date))
      .y(d => this.yScale(d.value));

    this.areas = area()
      .curve(curveMonotoneX)
      .x(d => this.xScale(d.data.date))
      .y0(d => this.yScale(d[0]))
      .y1(d => this.yScale(d[1]));

    this.shortValue = number =>
      number < 1000 ? number : format(".2s")(number);

    this._prepareSVG();

    if (Object.keys(this.rawData).length > 0) {
      this._prepareData();
    }

    // Include the tooltips logic, and set the context to this class
    tooltips.call(this);

    const resize = debounce(() => {
      if (this.hasRendered) {
        this._prepareSVG()
          ._prepareData()
          .render()
          .enableTooltip();
      }
    }, 100);

    select(window).on("resize", resize);
  }

  _prepareSVG() {
    this.svg.selectAll("*").remove();

    this.width =
      this.holder.clientWidth -
      this.margin.left -
      this.margin.right -
      this.padding.left -
      this.padding.right;

    this.height =
      this.svg.attr("height") -
      this.margin.top -
      this.margin.bottom -
      this.padding.top -
      this.padding.bottom;

    this.g = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    return this;
  }

  _prepareData() {
    if (this.options.stacked) {
      prepareStackedData.call(this);
    } else {
      prepareLineData.call(this);
    }

    prepareScales.call(this);

    if (this.options.annotations) {
      prepareAnnotationsData.call(this);
    }

    prepareAxis.call(this);

    return this;
  }

  /**
   *
   * @param {object} data
   * @param {string[]} data.buckets The list of dates in the format YYYY-MM-DD
   * @param {{name: string, values: number[]}[]} data.series The different series to show on the graph
   * @returns {ActiveDevicesGraph}
   */
  updateData(data) {
    if (!this.rawData.series) {
      this.rawData = data;
    } else {
      this.rawData.series = this.rawData.series.concat(data.series);
    }

    this.rawData.buckets = arraysMerge(data.buckets, this.rawData.buckets);

    this._prepareData();

    return this;
  }

  /**
   *
   * @returns {ActiveDevicesGraph}
   */
  render() {
    if (!this.tooltip) {
      this.tooltip = select(this.holder)
        .append("div")
        .attr("class", "p-tooltip");
    }

    if (this.options.area) {
      // renderArea.call(this);
      renderBars.call(this);
    } else {
      renderLines.call(this);
    }

    renderAnnotations.call(this);

    renderXAxis.call(this);
    renderYAxis.call(this);

    this.hasRendered = true;

    return this;
  }

  /**
   *
   * @returns {ActiveDevicesGraph}
   */
  show() {
    this.holder.style.opacity = 1;

    return this;
  }
}

export { ActiveDevicesGraph };
