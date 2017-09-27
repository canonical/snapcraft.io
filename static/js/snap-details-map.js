!(function(window, document, d3) {
  var data = [];

  // TODO: get data from template
  var snapData = {
    GB: 0.08566666666666665,
    IN: 0.08318181818181819,
    DE: 0.18,
    BR: 0.0775,
    CA: 0.08566666666666665,
    FR: 0.17533333333333337,
    IT: 0.09125000000000001,
    NZ: 0.1410526315789474,
    US: 0.4686206896551723,
    RS: 0.08636363636363636,
    CH: 0.08464285714285713
  }

  // TODO: move colors to CSS
  var colors = [
    '#cfe2f3',
    '#9fc5e8',
    '#6fa8dc',
    '#3d85c6',
    '#0b5394'
  ];

  var width = 990;
  var height = width / 2;

  var projection = d3.geoEquirectangular()
    .scale((width + 1) / 2 / Math.PI)
    .translate([(width / 2), (height / 2)])
    .clipExtent([[0,0], [width, height-80]])
    .precision(.1);

  var path = d3.geoPath()
    .projection(projection);

  var graticule = d3.geoGraticule();

  var svg = d3.select("#canvas-svg").append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

  // TODO: host data files ourselves?
  // TODO: avoid getting tsv data file (mapping ids, names, etc)
  d3.queue()
    .defer(d3.json, "https://d3js.org/world-110m.v1.json")
    .defer(d3.tsv, "https://d3js.org/world-110m.v1.tsv")
    .await(ready);

  function ready(error, world, worldData) {

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
      .attr("id", function(d, i) {
        return d.id;
      })
      .attr("title", function(d) {
        return d.properties.name;
      })
      .style("fill", function(d, index, test) {
        var id = d.id;
        var cData = worldData.filter(data => data.iso_n3 === id)[0];
        var cSnapData = snapData[cData.iso_a2];

        if (cSnapData) {
          var colorId = ~~(cSnapData * 5);
          var color = colors[colorId];
          return color;
        }

        return "#f4f4f4";
      })
      .on("mouseenter", function(d) {
        var pos = path.centroid(d);

        var id = d.id;
        var cData = worldData.filter(data => data.iso_n3 === id)[0];
        var cSnapData = snapData[cData.iso_a2];

        if (cSnapData) {
          // TODO: create 'tip' in JS, avoid getting it from HTML by id
          document.getElementById('tip').style.top = (pos[1]) + 'px';
          document.getElementById('tip').style.left = (pos[0]) + 'px';
          document.getElementById("tip-message").innerHTML = cData.name;
        }
      })
      .on("mouseout", function() {
        document.getElementById('tip').style.top = -1000 + 'px';
        document.getElementById('tip').style.left = -1000 + 'px';
      });

    g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b;
      }))
      .attr("class", "boundary")
      .attr("d", path);

    svg.attr("height", height - 80);
  };

  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");

})(window, document, d3);
