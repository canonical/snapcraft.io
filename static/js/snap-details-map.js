/* global d3, topojson */

!(function(window, document, d3) {
  function renderMap(el, data) {

    var snapData = data;

    // TODO: move colors to CSS
    var colors = [
      '#cfe2f3',
      '#9fc5e8',
      '#6fa8dc',
      '#3d85c6',
      '#0b5394',
      '#0b5394' // TODO: workaround for when value equals 1
    ];

    var width = 988; // 990 - 1px borders
    var height = width / 2;

    var projection = d3.geoEquirectangular()
      .scale((width + 1) / 2 / Math.PI)
      .translate([(width / 2), (height / 2)])
      .clipExtent([[0,0], [width, height-80]])
      .precision(.1);

    var path = d3.geoPath()
      .projection(projection);

    var graticule = d3.geoGraticule();

    var svg = d3.select(el).append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    // TODO: host data files ourselves?
    d3.queue()
      .defer(d3.json, "https://d3js.org/world-110m.v1.json")
      .await(ready);

    function ready(error, world) {

      var countries = topojson.feature(world, world.objects.countries).features;

      svg.append("path")
        .datum(graticule)
        .attr("class", "choropleth")
        .attr("d", path);

      var g = svg.append("g");
      var country = g.selectAll(".country").data(countries);

      country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d) {
          return d.id;
        })
        .attr("title", function(d) {
          return d.properties.name;
        })
        .style("fill", function(countryData) {
          var countrySnapData = snapData[countryData.id];

          if (countrySnapData) {
            var colorId = ~~(countrySnapData.percentage_of_users * 5);
            var color = colors[colorId];
            return color;
          }
        })
        .on("mouseenter", function(countryData) {
          var pos = path.centroid(countryData);
          var countrySnapData = snapData[countryData.id];

          if (countrySnapData) {
            // TODO: create 'tip' in JS, avoid getting it from HTML by id
            document.getElementById('tip').style.top = (pos[1]) + 'px';
            document.getElementById('tip').style.left = (pos[0]) + 'px';
            document.getElementById('tip').style.display = 'block';
            document.getElementById("tip-message").innerHTML = countrySnapData.name;
          }
        })
        .on("mouseout", function() {
          document.getElementById('tip').style.display = 'none';
        });

      g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
          return a !== b;
        }))
        .attr("class", "boundary")
        .attr("d", path);

      svg.attr("height", height - 80);
    }

    d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");

  }

  window.renderMap = renderMap;

})(window, document, d3);
