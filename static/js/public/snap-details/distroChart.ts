import { select } from "d3-selection";
import {
  hierarchy,
  pack,
  packSiblings,
  HierarchyCircularNode,
} from "d3-hierarchy";
import { forceSimulation, forceCollide, forceX, forceY } from "d3-force";

import chartTooltip from "./chartTooltip";
import debounce from "../../libs/debounce";

export type Entry = {
  name: string;
  value: number;
  rank?: number;
  slug?: string;
  children?: Entry[];
  folded?: Entry[];
};

type PackNode = HierarchyCircularNode<Entry>;

export const DISTRO_COLOURS: Record<string, string> = {
  ubuntu: "#e95420", // Ubuntu orange
  arch: "#2a78d6",
  linuxmint: "#159a6a",
  pop: "#cc7900", // $color-caution
  debian: "#d70a53", // Debian magenta
  fedora: "#4a3aa7",
  "opensuse-leap": "#0e8420", // $color-positive
  manjaro: "#008fb0",
};
const OTHER_COLOUR = "#666";

const TAIL_LIMIT = 6;
const CLUSTER_GAP = 20;
const VERSION_GAP = 0.07;
const INNER_SHARE = 0.82;
const INNER_OFFSET = 0.12;
const DISTRO_LABEL_HEIGHT = 24;
const DISTRO_FONT_SIZE = 14;
const VERSION_FONT_SIZES = [13, 12, 11, 10, 9];

export function colourFor(slug: string | undefined): string {
  return (slug && DISTRO_COLOURS[slug]) || OTHER_COLOUR;
}

function foldTail(entries: Entry[]): Entry[] {
  if (entries.length <= TAIL_LIMIT + 1) {
    return entries;
  }
  const rest = entries.slice(TAIL_LIMIT);
  return [
    ...entries.slice(0, TAIL_LIMIT),
    { name: `+${rest.length} more`, value: rest[0].value, folded: rest },
  ];
}

export function foldDistros(distros: Entry[]): Entry[] {
  const isNamed = (d: Entry) => d.slug! in DISTRO_COLOURS;
  const named = distros
    .filter(isNamed)
    .map((d) => ({ ...d, children: foldTail(d.children!) }));
  const rest = distros.filter((d) => !isNamed(d));

  if (rest.length === 0) {
    return named;
  }

  return [
    ...named,
    {
      name: "Other",
      slug: "other",
      value: rest[0].value,
      children: foldTail(rest.map((d) => ({ name: d.name, value: d.value }))),
    },
  ];
}

function area(value: number): number {
  return Math.max(value, 0.05);
}

function fits(label: string, radius: number, fontSize: number): boolean {
  return label.length * fontSize * 0.6 < radius * 2;
}

function swatch(slug: string | undefined): string {
  return `<span class="snapcraft-distro-packing__swatch" style="background-color: ${colourFor(
    slug,
  )}"></span>`;
}

function distroOf(d: PackNode): PackNode {
  return d.depth === 1 ? d : d.parent!;
}

function layout(data: Entry[]): PackNode {
  const root = hierarchy<Entry>({
    name: "root",
    value: 0,
    children: data,
  }) as PackNode;
  const distros = root.children || [];
  const base = 100;

  distros.forEach((d) => {
    d.r = base * d.data.value + CLUSTER_GAP / 2;
  });
  packSiblings(distros);
  distros.forEach((d) => {
    d.r -= CLUSTER_GAP / 2;
  });
  spreadHorizontally(distros);

  distros.forEach((d) => {
    const innerR = d.r * INNER_SHARE;
    const inner = pack<Entry>()
      .size([innerR * 2, innerR * 2])
      .padding(innerR * VERSION_GAP)(
      hierarchy<Entry>(d.data).sum((v) => (v.children ? 0 : area(v.value))),
    );

    (d.children || []).forEach((version, i) => {
      const placed = inner.children![i];
      version.x = d.x - innerR + placed.x;
      version.y = d.y + d.r * INNER_OFFSET - innerR + placed.y;
      version.r = placed.r;
    });
  });

  return root;
}

function spreadHorizontally(distros: PackNode[]) {
  const stretch = 1.6;
  distros.forEach((d) => {
    d.x *= stretch;
    d.y /= stretch;
  });

  forceSimulation(distros)
    .force("x", forceX(0).strength(0.03))
    .force("y", forceY(0).strength(0.06))
    .force(
      "collide",
      forceCollide<PackNode>((d) => d.r + CLUSTER_GAP / 2),
    )
    .stop()
    .tick(150);
}

function fitTo(root: PackNode, width: number, height: number) {
  const distros = root.children || [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  distros.forEach((d) => {
    minX = Math.min(minX, d.x - d.r);
    maxX = Math.max(maxX, d.x + d.r);
    minY = Math.min(minY, d.y - d.r);
    maxY = Math.max(maxY, d.y + d.r);
  });
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;

  distros.forEach((d) => {
    d.each((node) => {
      node.x = (node.x - minX) * scale + offsetX;
      node.y = (node.y - minY) * scale + offsetY;
      node.r *= scale;
    });
  });
}

function versionFontSize(d: PackNode): number {
  return VERSION_FONT_SIZES.find((size) => fits(d.data.name, d.r, size)) || 0;
}

function distroLabelPlacement(
  d: PackNode,
  versionFonts: Map<PackNode, number>,
): "inside" | "outside" | "none" {
  const versions = d.children || [];
  const bandTop = d.y - d.r;
  const topmostVersion = Math.min(...versions.map((v) => v.y - v.r));
  if (
    topmostVersion - bandTop >= DISTRO_LABEL_HEIGHT + 4 &&
    fits(d.data.name, d.r, DISTRO_FONT_SIZE)
  ) {
    return "inside";
  }
  const [only] = versions;
  if (
    versions.length === 1 &&
    only.data.name === d.data.name &&
    versionFonts.get(only)
  ) {
    return "none";
  }
  return "outside";
}

export default function renderDistroChart(el: string, distros: Entry[]) {
  const holder = select(el);
  const data = foldDistros(distros);
  const chart = holder.append("div");
  const tooltip = chartTooltip(holder, "snapcraft-distro-packing__tooltip");
  let renderedWidth = 0;

  holder
    .append("ul")
    .attr("class", "p-inline-list snapcraft-distro-packing__legend")
    .selectAll("li")
    .data(data)
    .enter()
    .append("li")
    .attr("class", "p-inline-list__item")
    .html((d) => `${swatch(d.slug)}${d.name}`);

  function tooltipContent(d: PackNode): string {
    const name =
      d.depth === 1 ? d.data.name : `${d.parent!.data.name} ${d.data.name}`;
    const lines = [d.data.rank ? `${name} &middot; #${d.data.rank}` : name];
    if (d.data.folded) {
      lines.push(d.data.folded.map((f) => f.name).join(", "));
    }
    return `${swatch(distroOf(d).data.slug)}<span class="u-no-margin--top">${lines.join(
      "<br />",
    )}</span>`;
  }

  function render() {
    const width = holder.property("clientWidth") as number;
    if (!width || width === renderedWidth) {
      return;
    }
    renderedWidth = width;
    const height = Math.min(width * 0.65, 600);

    const root = layout(data);
    fitTo(root, width, height);
    const nodes = root.descendants().filter((d) => d.depth > 0);
    const versionFonts = new Map(
      nodes.filter((d) => d.depth === 2).map((d) => [d, versionFontSize(d)]),
    );
    const placements = new Map(
      nodes
        .filter((d) => d.depth === 1)
        .map((d) => [d, distroLabelPlacement(d, versionFonts)]),
    );

    chart.html("");
    const svg = chart
      .append("svg")
      .attr("class", "snapcraft-distro-packing__svg")
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr(
        "aria-label",
        `Distributions by usage, most used first: ${data
          .map((d) => d.name)
          .join(", ")}`,
      );

    const group = svg
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", (d) =>
        d.depth === 1
          ? "snapcraft-distro-packing__distro"
          : "snapcraft-distro-packing__version",
      )
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("mouseenter", (_, d) => tooltip.show(tooltipContent(d)))
      .on("mousemove", (event) => {
        tooltip.move(event);
        event.stopPropagation();
      })
      .on("mouseleave", tooltip.hide);

    group
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => colourFor(distroOf(d).data.slug))
      .attr("fill-opacity", (d) => (d.depth === 1 ? 0.15 : 1));

    group
      .filter((d) => d.depth === 1 && placements.get(d) !== "none")
      .append("text")
      .attr("class", (d) =>
        placements.get(d) === "inside"
          ? "snapcraft-distro-packing__label"
          : "snapcraft-distro-packing__label snapcraft-distro-packing__label--outside",
      )
      .attr("text-anchor", "middle")
      .attr("y", (d) =>
        placements.get(d) === "inside" ? -d.r + DISTRO_LABEL_HEIGHT : -d.r - 6,
      )
      .text((d) => d.data.name);

    group
      .filter((d) => d.depth === 2 && versionFonts.get(d)! > 0)
      .append("text")
      .attr("class", "snapcraft-distro-packing__value")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", (d) => `${versionFonts.get(d)}px`)
      .text((d) => d.data.name);
  }

  render();
  window.addEventListener("resize", debounce(render, 100));
}
