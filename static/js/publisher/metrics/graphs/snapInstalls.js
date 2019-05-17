import Chart from "chart.js";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { schemeCategory10 } from "d3-scale-chromatic";
import { scaleOrdinal } from "d3-scale";

class SnapInstalls extends Component {
  constructor(props) {
    super(props);

    const metrics = [];
    const error = false;
    const loading = true;

    this.state = {
      metrics,
      error,
      loading
    };
  }

  transformMetrics(json) {
    let data = {
      series: [],
      max: 0,
      buckets: json.buckets
    };

    const mapValues = (value, index) => {
      if (data.max < value) {
        data.max = value;
      }

      return {
        x: json.buckets[index],
        y: value
      };
    };

    json.snaps.forEach(snap => {
      // Grab the continued installs serie
      const continuedInstalls = snap.series.filter(
        serie => serie.name === "continued"
      )[0];

      const item = {
        name: snap.name,
        values: continuedInstalls.values.map(mapValues)
      };

      data.series.push(item);
    });
    return data;
  }

  getMetrics(snaps, token) {
    // Limit snaps to 10 for performance reasons
    const filteredSnaps = {};

    Object.keys(snaps)
      .slice(0, 9)
      .forEach(key => {
        filteredSnaps[key] = snaps[key];
      });

    fetch("/snaps/metrics/json", {
      method: "POST",
      body: JSON.stringify(filteredSnaps),
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": token
      }
    })
      .then(response => {
        if (!response.ok) {
          throw "Could not fetch data.";
        }
        return response.json();
      })
      .then(json => {
        const loading = false;
        const metrics = this.transformMetrics(json);
        this.setState({ loading, metrics }, this.draw);
      })
      .catch(error => {
        this.setState({ error });
      });
  }

  draw() {
    if (this.canvas) {
      const metrics = this.state.metrics;
      const ctx = this.canvas.getContext("2d");

      const color = scaleOrdinal(schemeCategory10);
      const fontFamily =
        '"Ubuntu", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';

      const datasets = metrics.series.map((serie, i) => {
        const serieColor = color(i);
        return {
          label: serie.name,
          data: serie.values,
          fill: false,
          backgroundColor: serieColor,
          borderColor: serieColor
        };
      });

      new Chart(ctx, {
        type: "line",
        data: {
          datasets: datasets
        },
        options: {
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            point: {
              pointStyle: "circle"
            }
          },
          scales: {
            xAxes: [
              {
                type: "time",
                time: {
                  unit: "month",
                  tooltipFormat: "MMM D YYYY"
                },
                bounds: "data",
                gridLines: {
                  display: true,
                  lineWidth: 1
                },
                ticks: {
                  fontFamily: fontFamily,
                  fontColor: "rgba(0, 0, 0, 1)",
                  padding: 5
                }
              }
            ],
            yAxes: [
              {
                gridLines: {
                  display: true,
                  lineWidth: 1
                },
                ticks: {
                  fontFamily: fontFamily,
                  fontColor: "rgba(0, 0, 0, 1)",
                  padding: 10
                }
              }
            ]
          },
          legend: {
            position: "bottom",
            labels: {
              fontFamily: fontFamily,
              usePointStyle: true
            }
          },
          tooltips: {
            backgroundColor: "rgba(0,0,0,1)",
            bodyFontFamily: fontFamily,
            bodyFontSize: 14,
            bodySpacing: 5,
            caretPadding: 5,
            caretSize: 10,
            cornerRadius: 0,
            xPadding: 20,
            yPadding: 20,
            titleFontFamily: fontFamily,
            titleFontSize: 16,
            titleSpacing: 10,
            titleMarginBottom: 10
          }
        }
      });
    }
  }

  componentDidMount() {
    const { snaps, token } = this.props;
    this.getMetrics(snaps, token);
  }

  render() {
    const { error, loading } = this.state;

    if (error) {
      return (
        <div className="snap-installs-placeholder u-vertically-center">
          <span className="u-align-text--center">{error}</span>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="snap-installs-placeholder u-vertically-center">
          <span className="u-align-text--center">
            <i className="p-icon--spinner u-animation--spin is-large" />
          </span>
        </div>
      );
    }

    return <canvas ref={ref => (this.canvas = ref)} />;
  }
}

SnapInstalls.propTypes = {
  snaps: PropTypes.object,
  token: PropTypes.string
};

export default SnapInstalls;
