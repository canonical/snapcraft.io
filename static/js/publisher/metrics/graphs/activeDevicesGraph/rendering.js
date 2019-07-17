import { utcFormat } from "d3-time-format";
import { select } from "d3-selection";

function renderXAxis() {
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
}

function renderYAxis() {
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
}

function renderArea() {
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
}

function renderLines() {
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
}

function renderAnnotations() {
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
          .attr("transform", `translate(${annotation.x - textBox.width},10)`)
          .attr("x", 0);
      }
    });
  }
}

export { renderXAxis, renderYAxis, renderArea, renderLines, renderAnnotations };
