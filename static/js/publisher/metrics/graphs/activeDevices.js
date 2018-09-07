import { select, mouse } from 'd3-selection';
import { format } from 'd3-format';
import { utcParse, utcFormat } from 'd3-time-format';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import { area, stack, curveMonotoneX, stackOrderReverse } from 'd3-shape';
import { extent, bisector } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { cullXAxis, cullYAxis } from './helpers';
import { isMobile } from '../../../libs/mobile';
import debounce from '../../../libs/debounce';

function showGraph(el) {
  el.style.opacity = 1;
}

const shortValue = number => number < 1000 ? number : format('.2s')(number);
const commaValue = number => format(',')(number);
const tooltipTimeFormat = utcFormat('%Y-%m-%d');

const xScaleFunc = (padding, width, data) => {
  return scaleLinear()
    .rangeRound([padding.left, width - padding.left - padding.right])
    .domain(extent(data, d => d.date));
};

const yScaleFunc = (padding, height, max) => {
  return scaleLinear()
    .rangeRound([height - padding.top - padding.bottom, padding.top]).nice()
    .domain([0, max + Math.ceil(max * 0.1)]);
};

const colourScaleFunc = (keys) => {
  return scaleOrdinal(schemePaired)
    .domain(keys);
};

const getStackedData = (keys, data) => {
  const stackFunc = stack()
    .order(stackOrderReverse)
    .keys(keys);

  return stackFunc(data);
};

const bisectDate = bisector(d => d.date).left;

const tooltipRows = (data, currentHoverKey, colorScale) => {
  let dataArr = [];
  let total = 0;
  let other = {
    key: 'other',
    value: 0,
    count: 0
  };

  Object.keys(data)
    .filter(key => key !== 'date')
    .forEach(key => {
      total += data[key];

      dataArr.push({
        key: key,
        value: data[key]
      });
    });

  dataArr.sort((a, b) => b.value - a.value);

  // Filter out anything below 0.1% of the total users
  // If there are more than 10 series
  if (dataArr.length > 10) {
    dataArr.forEach(item => {
      if (item.value / total < 0.001) {
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

  return dataArr.map(item => {
    if (!item.skip) {
      return [
        `<span class="snapcraft-graph-tooltip__series${item.key === currentHoverKey ? ' is-hovered' : ''}" title="${item.key}">`,
        `<span class="snapcraft-graph-tooltip__series-name">${item.key}</span>`,
        `<span class="snapcraft-graph-tooltip__series-color"${!item.count ? `style="background:${colorScale(item.key)};"` : ''}></span>`,
        `<span class="snapcraft-graph-tooltip__series-value">${commaValue(item.value)}</span>`,
        `</span>`
      ].join('');
    }
  }).join('');
};

const tooltipTemplate = (data, currentHoverKey, colorScale) => {
  return [
    `<div class="p-tooltip p-tooltip--top-center" style="display: block;">`,
    `<span class="p-tooltip__message" role="tooltip" style="display: block;">`,
    `<span class="snapcraft-graph-tooltip__title">${tooltipTimeFormat(data.date)}</span>`,
    tooltipRows(data, currentHoverKey, colorScale),
    `</span>`,
    `</div>`
  ].join('');
};

function drawGraph(holder, activeDevices) {
  // Basic svg setup
  const svg = select('svg');
  svg.attr('width', holder.clientWidth);
  svg.selectAll("*").remove();

  const margin = { top: 20, right: 0, bottom: 30, left: 50 };
  const padding = { top: 0, right: 0, bottom: 16, left: 16 };
  const width = svg.attr('width') - margin.left - margin.right - padding.left - padding.right;
  const height = svg.attr('height') - margin.top - margin.bottom - padding.top - padding.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Prepare the data
  const _data = [];
  const _keys = [];
  let max = 0;
  activeDevices.buckets.forEach((bucket, i) => {
    let obj = {
      date: utcParse('%Y-%m-%d')(bucket)
    };

    activeDevices.series.forEach(series => {
      obj[series.name] = series.values[i];
      if (_keys.indexOf(series.name) < 0) {
        _keys.push(series.name);
      }
    });

    _data.push(obj);
  });

  _data.forEach(date => {
    const _max = Object.keys(date)
      .filter(key => key !== 'date')
      .reduce((previous, key) => previous + date[key], 0);

    if (_max > max) {
      max = _max;
    }
  });

  // Colours
  const colorScale = colourScaleFunc(_keys);

  // Scales
  const xScale = xScaleFunc(padding, width, _data);
  const yScale = yScaleFunc(padding, height, max);

  // Stack the data
  const stackData = getStackedData(_keys, _data);

  // Add the 'layer' group
  const layer = g.selectAll('.layer')
    .data(stackData)
    .enter()
    .append('g')
    .attr('class', 'layer');

  // Add the areas
  const areas = area()
    .curve(curveMonotoneX)
    .x(d => xScale(d.data.date))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]));

  layer.append('path')
    .attr('class', 'area')
    .style('fill', d => colorScale(d.key))
    .attr('d', areas)
    .on('mousemove', mouseMove)
    .on('mouseout', cancelTooltip);

  // Add the x axix
  let tickValues = [];
  if (isMobile() && _data.length > 90) {
    // Get the first day of each month
    let monthCache = false;
    tickValues = _data.filter(item => {
      if (!monthCache || item.date.getMonth() !== monthCache) {
        monthCache = item.date.getMonth();
        return true;
      }
      return false;
    }).map(item => item.date);
  } else {
    tickValues = _data.map(item => item.date);
  }

  const xAxis = axisBottom(xScale)
    .tickValues(tickValues)
    .tickPadding(16);

  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis.tickFormat(utcFormat('%b %e')));

  cullXAxis();

  // Add the y axis
  g.append('g')
    .attr('class', 'axis axis--y')
    .call(axisLeft(yScale).tickFormat(d => d === 0 ? '0' : shortValue(d)));

  cullYAxis();

  const tooltip = select(holder)
    .append('div')
    .attr('class', 'p-tooltip');

  function mouseMove(d) {
    const mousePosition = mouse(this);

    const x0 = xScale.invert(mousePosition[0]);
    const _date = new Date(x0);
    _date.setHours(0);
    _date.setMinutes(0);
    _date.setSeconds(0);
    _date.setMilliseconds(0);
    const i = bisectDate(_data, _date.getTime(), 0);

    const current = d.key;
    const dateData = _data[i];

    tooltip.html(tooltipTemplate(dateData, current, colorScale))
      .style('top', `${mousePosition[1]}px`)
      .style('left', `${mousePosition[0] + margin.left}px`)
      .style('display', 'block');
  }

  function cancelTooltip() {
    tooltip.style('display', 'none');
  }

  showGraph(holder);
}

export default function activeDevices(holderSelector, activeDevices) {
  const holder = document.querySelector(holderSelector);

  if (!holder) {
    return;
  }

  drawGraph(holder, activeDevices);

  const resize = debounce(function() {
    drawGraph(holder, activeDevices);
  }, 100);

  select(window).on('resize', resize);
}
