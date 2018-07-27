import { select as d3Select, mouse as d3Mouse } from 'd3-selection';
import { format as d3Format } from 'd3-format';
import { utcParse as d3TimeParse, utcFormat as d3TimeFormat } from 'd3-time-format';
import { scaleLinear as d3ScaleLinear, scaleOrdinal as d3ScaleOrdinal } from 'd3-scale';
import { schemePaired as d3SchemePaired } from 'd3-scale-chromatic';
import { area as d3Area, stack as d3Stack, curveMonotoneX as d3CurveMonotoneX, stackOrderReverse as d3StackOrderReverse } from 'd3-shape';
import { extent as d3Extent, bisector as d3Bisector } from 'd3-array';
import { axisBottom as d3AxisBottom, axisLeft as d3AxisLeft } from 'd3-axis';
import { cullXAxis, cullYAxis } from './helpers';

function showGraph(el) {
  el.style.opacity = 1;
}

export default function activeDevices(activeDevices) {
  // Basic svg setup
  const holder = document.querySelector('svg').parentNode;
  const svg = d3Select('svg');
  svg.attr('width', holder.clientWidth);
  const margin = { top: 20, right: 0, bottom: 30, left: 50 };
  const padding = { top: 0, right: 0, bottom: 16, left: 16 };
  const width = svg.attr('width') - margin.left - margin.right - padding.left - padding.right;
  const height = svg.attr('height') - margin.top - margin.bottom - padding.top - padding.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Prepare the data
  const parseTime = d3TimeParse('%Y-%m-%d');
  const _data = [];
  const _keys = [];
  let max = 0;
  activeDevices.buckets.forEach((bucket, i) => {
    let obj = {
      date: parseTime(bucket)
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
    const _max = Object.keys(date).filter(key => key !== 'date').reduce((previous, key) => {
      return previous + date[key];
    }, 0);

    if (_max > max) {
      max = _max;
    }
  });

  const shortValue = number => {
    if (number < 1000) {
      return number;
    }
    return d3Format('.2s')(number);
  };

  const commaValue = number => {
    return d3Format(',')(number);
  };

  // Prepare the axis
  const x = d3ScaleLinear().
    rangeRound([padding.left, width - padding.left - padding.right]);
  x.domain(d3Extent(_data, d => { return d.date; }));

  const y = d3ScaleLinear().
    rangeRound([height - padding.top - padding.bottom, padding.top]).nice();
  y.domain([0, max + Math.ceil(max * 0.1)]);

  // Colours
  const color = d3ScaleOrdinal(d3SchemePaired);
  color.domain(_keys);

  // Prepare the stack
  const stack = d3Stack().
    order(d3StackOrderReverse);
  stack.keys(_keys);

  const stackData = stack(_data);

  // Add the 'layer' groups
  const layer = g.selectAll('.layer').
    data(stackData).
    enter().append('g').
    attr('class', 'layer');

  // Add the areas
  const area = d3Area().
    curve(d3CurveMonotoneX).
    x(d => { return x(d.data.date); }).
    y0(d => { return y(d[0]); }).
    y1(d => { return y(d[1]); });

  layer.append('path').
    attr('class', 'area').
    style('fill', d => { return color(d.key); }).
    attr('d', area).
    on('mousemove', mouseMove).
    on('mouseout', cancelTooltip);

  // Add the x axis
  const xAxisBase = d3AxisBottom(x);
  let xAxis;
  if (_data.length > 30) {
    xAxis = xAxisBase.ticks(30);
  } else {
    xAxis = xAxisBase.tickValues(_data.map(item => {
      return item.date;
    }));
  }
  g.append('g').
    attr('class', 'axis axis--x').
    attr('transform', `translate(0,${height})`).
    call(xAxis.tickFormat(d3TimeFormat("%b %e")));

  cullXAxis();

  // Add the y axis
  g.append('g').
    attr('class', 'axis axis--y').
    call(d3AxisLeft(y).tickFormat(d => { if (d === 0) { return '0'; } return shortValue(d); }));

  cullYAxis();

  const tooltip = d3Select(holder).append('div').
    attr('class', 'p-tooltip');


  const tooltipTimeFormat = d3TimeFormat('%Y-%m-%d');

  const tooltipRows = (data, currentHoverKey) => {
    let template = [];

    let dataArr = [];
    let total = 0;

    let other = {
      key: 'other',
      value: 0,
      count: 0
    };

    Object.keys(data).filter(key => key !== 'date').forEach(key => {
      total += data[key];

      dataArr.push({
        key: key,
        value: data[key]
      });
    });

    dataArr.sort((a, b) => {
      return b.value - a.value;
    });

    // Filter out anything below 0.1% of the total users
    // If there are more then 10 series
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

    dataArr.forEach(item => {
      if (!item.skip) {
        template.push(`<span class="snapcraft-graph-tooltip__series${item.key === currentHoverKey ? ' is-hovered' : ''}" title="${item.key}">
          <span class="snapcraft-graph-tooltip__series-name">${item.key}</span>
          <span class="snapcraft-graph-tooltip__series-color"${!item.count ? `style="background:${color(item.key)};"` : ''}></span>
          <span class="snapcraft-graph-tooltip__series-value">${commaValue(item.value)}</span>
        </span>`);
      }
    });
    return template.join('');
  };

  const tooltipTemplate = (data, currentHoverKey) => {
    let template = [];
    template.push('<div class="p-tooltip p-tooltip--top-center" style="display: block;">');
    template.push('<span class="p-tooltip__message" role="tooltip" style="display:block;">');
    template.push(`<span class="snapcraft-graph-tooltip__title">${tooltipTimeFormat(data.date)}</span>`);
    template.push(tooltipRows(data, currentHoverKey));
    template.push('</span></div>');
    return template.join('');
  };

  const bisectDate = d3Bisector(function(d) { return d.date; }).left;

  function mouseMove(d) {
    const x0 = x.invert(d3Mouse(this)[0]);
    const i = bisectDate(_data, x0, 1) - 1;
    const current = d.key;
    const dateData = _data[i];
    const mousePosition = d3Mouse(holder);

    tooltip.html(tooltipTemplate(dateData, current))
      .style('top', `${mousePosition[1]}px`)
      .style('left', `${mousePosition[0]}px`)
      .style('display', 'block');
  }

  function cancelTooltip() {
    tooltip.style('display', 'none');
  }

  showGraph(document.getElementById('active_devices'));
}
