export default function (
  snapcraftGraphTooltip, 
  positionTooltip, 
  formatXAxisTickLabels, 
  formatYAxisTickLabels,
  COLORS,
  days,
  installs) {
  bb.generate({
    bindto: '#installs_metrics',
    legend: {
      hide: true
    },
    padding: {
      top: 0,
      left: 72,
      bottom: 0,
      right: 112
    },
    tooltip: {
      contents: snapcraftGraphTooltip,
      position: positionTooltip
    },
    transition: {
      duration: 0
    },
    point: {
      focus: false
    },
    axis: {
      x: {
        tick: {
          culling: false,
          outer: true,
          format: formatXAxisTickLabels
        }
      },
      y: {
        tick: {
          format: formatYAxisTickLabels
        }
      }
    },
    bar: {
      width: 4
    },
    resize: {
      auto: false
    },
    data: {
      colors: COLORS,
      type: 'bar',
      x: 'x',
      columns: [
        days,
        installs
      ]
    }
  });
}