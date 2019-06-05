import { select, mouse } from "d3-selection";
import { format } from "d3-format";
import { utcParse, utcFormat } from "d3-time-format";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { schemePaired } from "d3-scale-chromatic";
import { area, stack, curveMonotoneX, stackOrderReverse, line } from "d3-shape";
import { extent, bisector } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { isMobile } from "../../../libs/mobile";
import debounce from "../../../libs/debounce";
import { sortChannels } from "../../../libs/channels";
import { arraysMerge } from "../../../libs/arrays";

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

    this.showTooltips = false;

    this.hasRendered = false;

    this.lines = line()
      .x(d => this.xScale(d.date))
      .y(d => this.yScale(d.value));

    this.areas = area()
      .curve(curveMonotoneX)
      .x(d => this.xScale(d.data.date))
      .y0(d => this.yScale(d[0]))
      .y1(d => this.yScale(d[1]));

    this.shortValue = number =>
      number < 1000 ? number : format(".2s")(number);
    this.commaValue = number => format(",")(number);
    this.tooltipTimeFormat = utcFormat("%Y-%m-%d");

    this.prepareSVG();

    if (Object.keys(this.rawData).length > 0) {
      this.prepareData();
    }

    const resize = debounce(() => {
      if (this.hasRendered) {
        this.prepareSVG()
          .prepareData()
          .render()
          .enableTooltip();
      }
    }, 100);

    select(window).on("resize", resize);
  }

  prepareSVG() {
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

  prepareData() {
    const prepareStackedData = () => {
      const _data = [];
      const _keys = [];
      let max = 0;

      const getStackedData = (keys, data) => {
        const stackFunc = stack()
          .order(stackOrderReverse)
          .keys(keys);

        return stackFunc(data);
      };

      this.rawData.buckets.forEach((bucket, i) => {
        let obj = {
          date: utcParse("%Y-%m-%d")(bucket)
        };

        this.rawData.series.forEach(series => {
          obj[series.name] = series.values[i];
          if (_keys.indexOf(series.name) < 0) {
            _keys.push(series.name);
          }
        });

        _data.push(obj);
      });

      _data.forEach(date => {
        const _max = Object.keys(date)
          .filter(key => key !== "date")
          .reduce((previous, key) => previous + date[key], 0);

        if (_max > max) {
          max = _max;
        }
      });

      this.data = _data;
      this.keys = _keys;
      this.maxYValue = max;
      this.transformedData = getStackedData(_keys, _data);
    };

    const prepareLineData = () => {
      const _data = [];
      const _keys = [];
      const data = [];

      this.rawData.series.forEach(series => {
        _keys.push(series.name);
        const obj = {
          name: series.name,
          values: []
        };
        series.values.forEach((value, index) => {
          obj.values.push({
            date: utcParse("%Y-%m-%d")(this.rawData.buckets[index]),
            value: value
          });
        });
        data.push(obj);
      });

      this.rawData.buckets.forEach((bucket, i) => {
        const obj = {
          date: utcParse("%Y-%m-%d")(bucket)
        };

        data.forEach(series => {
          obj[series.name] = series.values[i].value;
        });

        _data.push(obj);
      });

      const values = this.rawData.series.reduce((acc, current) => {
        return acc.concat(current.values);
      }, []);

      this.data = _data;
      this.keys = _keys;
      this.maxYValue = Math.max(...values);
      this.transformedData = data;
    };

    const prepareScales = () => {
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

      this.xScale = scaleLinear()
        .rangeRound([
          this.padding.left,
          this.width - this.padding.left - this.padding.right
        ])
        .domain(extent(this.data, d => d.date));
      this.yScale = scaleLinear()
        .rangeRound([
          this.height - this.padding.top - this.padding.bottom,
          this.padding.top
        ])
        .nice()
        .domain([0, this.maxYValue + Math.ceil(this.maxYValue * 0.1)]);
    };

    const prepareAnnotationsData = () => {
      let annotationsData;
      annotationsData = [];
      this.options.annotations.buckets.forEach((bucket, i) => {
        let obj = {
          date: utcParse("%Y-%m-%d")(bucket)
        };

        this.options.annotations.series.forEach(series => {
          obj[series.name] = series.values[i];
          if (this.keys.indexOf(series.name) < 0) {
            this.keys.push(series.name);
          }
        });

        annotationsData.push(obj);
      });

      annotationsData.sort((a, b) => {
        const aTime = a.date.getTime();
        const bTime = b.date.getTime();
        return aTime - bTime;
      });

      if (annotationsData) {
        annotationsData = annotationsData
          .map(annotation => {
            let x = this.xScale(annotation.date);

            if (x < 0 + this.padding.left) {
              return false;
            }
            return {
              x,
              y1: this.yScale(1),
              data: annotation
            };
          })
          .filter(item => item !== false);
      }

      this.annotationsData = annotationsData.filter(item => item !== false);
    };

    if (this.options.stacked) {
      prepareStackedData();
    } else {
      prepareLineData();
    }

    prepareScales();

    if (this.options.annotations) {
      prepareAnnotationsData();
    }

    this.colorScale = scaleOrdinal(schemePaired).domain(this.keys);

    // xAxis
    let tickValues = [];
    this.xAxisTickFormat = "%b %e";

    // The ticks get cramped when there are too many data points
    if (this.data.length > 360) {
      // This restricts anything over 1 year
      tickValues = this.data
        .filter((item, i) => {
          return i % 14 === 0;
        })
        .map(item => item.date);
      this.xAxisTickFormat = "%b %e %Y";
    } else if (isMobile() && this.data.length > 90) {
      // This restricts anything over 3 months and if viewing on a mobile
      // Get the first day of each month
      let monthCache = false;
      tickValues = this.data
        .filter(item => {
          if (!monthCache || item.date.getMonth() !== monthCache) {
            monthCache = item.date.getMonth();
            return true;
          }
          return false;
        })
        .map(item => item.date);
    } else {
      tickValues = this.data.map(item => item.date);
    }

    this.xAxis = axisBottom(this.xScale)
      .tickValues(tickValues)
      .tickPadding(16);

    this.yAxis = axisLeft(this.yScale).tickFormat(
      d => (d === 0 ? "0" : this.shortValue(d))
    );

    return this;
  }

  updateData(data) {
    if (!this.rawData.series) {
      this.rawData = data;
    } else {
      this.rawData.series = this.rawData.series.concat(data.series);
    }

    this.rawData.buckets = arraysMerge(data.buckets, this.rawData.buckets);

    this.prepareData();

    return this;
  }

  render() {
    const renderXAxis = () => {
      // Add the x axis
      const freq = 7;
      let xAxis = this.g.selectAll(".axis.axis--x");

      if (xAxis.size() > 0) {
        xAxis.call(this.xAxis.tickFormat(utcFormat(this.xAxisTickFormat)));
      } else {
        xAxis = this.g
          .append("g")
          .attr("class", "axis axis--x")
          .attr("transform", `translate(0, ${this.height})`)
          .call(this.xAxis.tickFormat(utcFormat(this.xAxisTickFormat)));
      }

      let monthCache;

      xAxis.selectAll(".tick").each((d, i, nodes) => {
        const node = select(nodes[i]);
        if (i % freq !== 0 && nodes.length > 7) {
          node.select("text").attr("opacity", "0");
        } else {
          node.classed("active", true);
          node.select("line").attr("transform", "scale(1, 2)");

          const text = node.select("text");

          const month = text.text().split(/(\s+)/);
          if (month[0] === monthCache) {
            text.text(month[month.length - 1]);
          }
          monthCache = month[0];
        }
      });
    };

    const renderYAxis = () => {
      // Add the y axis
      const freq = 5;
      let yAxis = this.g.selectAll(".axis.axis--y");

      if (yAxis.size() > 0) {
        yAxis.call(this.yAxis);
      } else {
        yAxis = this.g
          .append("g")
          .attr("class", "axis axis--y")
          .call(this.yAxis);
      }

      yAxis.selectAll(".tick").each((d, i, nodes) => {
        const node = select(nodes[i]);
        if (i % freq === 0) {
          node.classed("active", true);
          node
            .select("text")
            .attr("opacity", 1)
            .attr("transform", "translate(-13,0)");
          node.select("line").attr("transform", "scale(2.666666, 1)");
        } else {
          node.select("text").attr("opacity", 0);
        }
      });
    };

    const renderArea = () => {
      let areaLayer = this.g.selectAll(".layer.data-layer");

      if (areaLayer.size() === 0) {
        areaLayer = this.g.append("g").attr("class", "layer data-layer");
      }

      areaLayer
        .selectAll(".area")
        .data(this.transformedData)
        .enter()
        .append("path")
        .attr("class", "area")
        .attr("pointer-events", "none")
        .attr("fill", d => this.colorScale(d.key))
        .attr("d", this.areas);
    };

    const renderLines = () => {
      let pathsLayer = this.g.selectAll(".layer.data-layer");

      if (pathsLayer.size() === 0) {
        pathsLayer = this.g.append("g").attr("class", "layer data-layer");
      }

      const paths = pathsLayer.selectAll(".path").data(this.transformedData);

      paths.exit().remove();

      paths
        .enter()
        .append("path")
        .attr("class", "path")
        .attr("pointer-events", "none")
        .attr("data-name", d => d.name)
        .style("stroke", d => this.colorScale(d.name))
        .style("fill", "none")
        .merge(paths)
        .attr("d", d => this.lines(d.values));
    };

    const renderAnnotations = () => {
      if (this.annotationsData && this.annotationsData.length > 0) {
        this.annotationsData.forEach(annotation => {
          const annotationKey = Object.keys(annotation.data)
            .filter(key => key !== "date")
            .filter(key => annotation.data[key] !== 0)[0];

          // Add annotations
          const annotationsLayer = this.g
            .append("g")
            .attr("class", "annotationsLayer")
            .attr("id", `category-${annotationKey}`)
            .style("visibility", "hidden");

          const lineLayer = annotationsLayer.append("g");
          const textLayer = annotationsLayer.append("g");

          lineLayer
            .append("line")
            .attr("class", "annotation-line")
            .attr("transform", `translate(${annotation.x},0)`)
            .attr("y0", 0)
            .attr("y1", annotation.y1)
            .attr("stroke", "#000")
            .attr("style", "pointer-events: none;");

          let display_name = annotationKey.split("-").join(" ");
          display_name =
            display_name.substr(0, 1).toUpperCase() + display_name.substring(1);

          const text = textLayer
            .append("text")
            .attr("class", "annotation-text")
            .attr("transform", `translate(${annotation.x},10)`)
            .attr("x", 2)
            .style("font-size", "12px")
            .text(`${display_name}`);

          const textBox = text._groups[0][0].getBBox();
          const gBox = this.g._groups[0][0].getBBox();
          const textBoxRightEdge = annotation.x + textBox.x + textBox.width;
          if (textBoxRightEdge > gBox.width) {
            text
              .attr(
                "transform",
                `translate(${annotation.x - textBox.width},10)`
              )
              .attr("x", 0);
          }
        });
      }
    };

    if (!this.tooltip) {
      this.tooltip = select(this.holder)
        .append("div")
        .attr("class", "p-tooltip");
    }

    if (this.options.area) {
      renderArea();
    } else {
      renderLines();
    }

    renderAnnotations();

    renderXAxis();
    renderYAxis();

    this.hasRendered = true;

    return this;
  }

  tooltipTemplate(dateData, currentHoverKey) {
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
              `<span class="snapcraft-graph-tooltip__series-value">${this.commaValue(
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
      `<span class="snapcraft-graph-tooltip__title">${this.tooltipTimeFormat(
        dateData.date
      )}</span>`,
      tooltipRows(dateData, currentHoverKey),
      `</span>`,
      `</div>`
    ].join("");
  }

  mouseMove(d, index, nodes) {
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
      .html(this.tooltipTemplate(dateData, currentHoverKey))
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
  }

  cancelTooltip() {
    this.tooltip.style("display", "none");
  }

  show() {
    this.holder.style.opacity = 1;

    return this;
  }

  enableTooltip() {
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
      .on("mousemove", this.mouseMove.bind(this))
      .on("mouseout", this.cancelTooltip.bind(this));

    this.showTooltips = true;

    return this;
  }
}

export { ActiveDevicesGraph };
