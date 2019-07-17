import { stack, stackOrderReverse } from "d3-shape";
import { utcParse } from "d3-time-format";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { extent } from "d3-array";
import { schemePaired } from "d3-scale-chromatic";
import { isMobile } from "../../../../libs/mobile";
import { axisBottom, axisLeft } from "d3-axis";

function prepareStackedData() {
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
}

function prepareLineData() {
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
}

function prepareScales() {
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
}

function prepareAnnotationsData() {
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
}

function prepareAxis() {
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
}

export {
  prepareStackedData,
  prepareLineData,
  prepareScales,
  prepareAnnotationsData,
  prepareAxis
};
