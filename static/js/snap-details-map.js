/* global d3, topojson */

!(function(window, document, d3, topojson) {
  function renderMap(el, snapData) {
    var mapEl = d3.select(el);

    d3.queue()
      .defer(d3.json, "/static/js/world-110m.v1.json")
      .await(ready);

    function render(mapEl, snapData, world) {
      var width = mapEl.property('clientWidth');
      var height = width * 0.73;
      // some offset to hide empty top of the map
      var offset = width * 0.12;

      var projection = d3.geoNaturalEarth1()
        .scale(width * 0.2)
        .translate([(width / 2), ((height - offset) / 2) ])
        .precision(.1);

      // rotate not to split Asia
      projection.rotate([-10, 0]);

      var path = d3.geoPath()
        .projection(projection);

      // clean up HTML before rendering map
      mapEl.html('');

      var svg = mapEl.append("svg")
        .attr("width", width)
        .attr("height", height - offset);

      var tooltip = mapEl.append("div")
        .attr("class", "map-tooltip u-no-margin");

      var tooltipMsg = tooltip.append("div")
        .attr("class", "p-tooltip__message");

      var countries = topojson.feature(world, world.objects.countries).features;

      var g = svg.append("g");
      var country = g.selectAll(".country").data(countries);

      country.enter().insert("path")
        .attr("class", function(countryData) {
          var className = "country";

          var countrySnapData = snapData[countryData.id];

          if (countrySnapData) {
            var colorId = ~~(countrySnapData.percentage_of_users * 5);
            if (colorId > 4) { colorId = 4; } // so that 100% doesn't go out of scale

            className = className + '--scale-' + colorId;
          }

          return className;
        })
        .attr("d", path)
        .attr("id", function(d) {
          return d.id;
        })
        .attr("title", function(d) {
          return d.properties.name;
        })
        .on("mouseenter", function(countryData) {
          var pos = path.centroid(countryData);
          var countrySnapData = snapData[countryData.id];
          var className = 'swatch';

          if (countrySnapData) {
            var colorId = ~~(countrySnapData.percentage_of_users * 5);
            if (colorId > 4) { colorId = 4; } // so that 100% doesn't go out of scale

            className = className + '--scale-' + colorId;

            tooltip
              .style('top', pos[1] + 'px')
              .style('left', pos[0] + 'px')
              .style('display', 'block');
            tooltipMsg.html(
              '<span class="swatch '+ className + '"></span>' + countrySnapData.name
            );
          }
        })
        .on("mouseout", function() {
          tooltip.style('display', 'none');
        });

      g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
          return a !== b;
        }))
        .attr("class", "boundary")
        .attr("d", path);
    }

    function ready(error, world) {
      render(mapEl, snapData, world);

      var resizeTimeout;

      window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
          render(mapEl, snapData, world);
        }, 100);
      });
    }
  }

  window.renderMap = renderMap;

})(window, document, d3, topojson);
