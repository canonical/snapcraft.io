import "@testing-library/jest-dom";
import renderDistroChart, {
  foldDistros,
  colourFor,
  DISTRO_COLOURS,
  Entry,
} from "../distroChart";

// as built by OsMetric.os_tree: ordered by value, ranked, versions
// ranked across the snap
const DISTROS: Entry[] = [
  {
    name: "Ubuntu",
    slug: "ubuntu",
    value: 0.3,
    rank: 1,
    children: [
      { name: "24.04", value: 0.3, rank: 1 },
      { name: "22.04", value: 0.25, rank: 2 },
    ],
  },
  {
    name: "Debian",
    slug: "debian",
    value: 0.07,
    rank: 2,
    children: [{ name: "12", value: 0.07, rank: 3 }],
  },
  {
    name: "Zorin OS",
    slug: "zorin",
    value: 0.02,
    rank: 3,
    children: [{ name: "17", value: 0.02, rank: 4 }],
  },
  {
    name: "Solus",
    slug: "solus",
    value: 0.01,
    rank: 4,
    children: [{ name: "Solus", value: 0.01, rank: 5 }],
  },
];

describe("foldDistros", () => {
  it("keeps distros with a fixed colour and folds the rest into Other", () => {
    const folded = foldDistros(DISTROS);

    expect(folded.map((d) => d.name)).toEqual(["Ubuntu", "Debian", "Other"]);
    expect(folded[2]).toEqual({
      name: "Other",
      slug: "other",
      value: 0.02,
      children: [
        { name: "Zorin OS", value: 0.02 },
        { name: "Solus", value: 0.01 },
      ],
    });
  });

  it("does not add Other when every distro is known", () => {
    expect(foldDistros(DISTROS.slice(0, 2))).toHaveLength(2);
  });

  it("folds a long tail of versions into one '+N more' entry", () => {
    const versions = Array.from({ length: 10 }, (_, i) => ({
      name: `${10 + i}.04`,
      value: 1 - i * 0.05,
      rank: i + 1,
    }));
    const [ubuntu] = foldDistros([
      { name: "Ubuntu", slug: "ubuntu", value: 1, children: versions },
    ]);

    expect(ubuntu.children).toHaveLength(7);
    expect(ubuntu.children![6]).toMatchObject({
      name: "+4 more",
      value: 0.7,
    });
    expect(ubuntu.children![6].folded?.map((v) => v.name)).toEqual([
      "16.04",
      "17.04",
      "18.04",
      "19.04",
    ]);
  });
});

describe("colourFor", () => {
  it("returns the fixed colour for known distros and a neutral otherwise", () => {
    expect(colourFor("ubuntu")).toBe(DISTRO_COLOURS.ubuntu);
    expect(colourFor("zorin")).toBe("#666");
    expect(colourFor(undefined)).toBe("#666");
  });
});

describe("renderDistroChart", () => {
  const clientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientWidth",
  );

  beforeEach(() => {
    document.body.innerHTML = `<div id="chart"></div>`;
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    if (clientWidth) {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", clientWidth);
    }
  });

  it("renders one group per distro and one per version", () => {
    renderDistroChart("#chart", DISTROS);

    // Ubuntu, Debian, Other
    expect(
      document.querySelectorAll(".snapcraft-distro-packing__distro"),
    ).toHaveLength(3);
    // 24.04, 22.04, 12, Zorin OS, Solus
    expect(
      document.querySelectorAll(".snapcraft-distro-packing__version"),
    ).toHaveLength(5);
  });

  it("renders a legend entry per distro with the matching swatch", () => {
    renderDistroChart("#chart", DISTROS);

    const items = document.querySelectorAll(
      ".snapcraft-distro-packing__legend li",
    );
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Ubuntu");
    expect(
      items[0].querySelector<HTMLElement>(".snapcraft-distro-packing__swatch")
        ?.style.backgroundColor,
    ).toBe("rgb(233, 84, 32)");
  });

  it("describes the chart for assistive tech", () => {
    renderDistroChart("#chart", DISTROS);

    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg?.getAttribute("aria-label")).toContain("Ubuntu, Debian");
  });

  it("shows name and rank in the tooltip on hover", () => {
    renderDistroChart("#chart", DISTROS);

    const version = document.querySelector(
      ".snapcraft-distro-packing__version",
    ) as SVGGElement;
    version.dispatchEvent(new MouseEvent("mouseenter"));

    const tooltip = document.querySelector<HTMLElement>(
      ".snapcraft-distro-packing__tooltip",
    );
    expect(tooltip?.style.display).toBe("block");
    expect(tooltip).toHaveTextContent("Ubuntu 24.04 · #1");

    version.dispatchEvent(new MouseEvent("mouseleave"));
    expect(tooltip?.style.display).toBe("none");
  });

  it("shows no rank for folded buckets", () => {
    renderDistroChart("#chart", DISTROS);

    const other = [
      ...document.querySelectorAll(".snapcraft-distro-packing__distro"),
    ].find((g) => g.textContent?.includes("Other")) as SVGGElement;
    other.dispatchEvent(new MouseEvent("mouseenter"));

    const tooltip = document.querySelector(
      ".snapcraft-distro-packing__tooltip",
    );
    expect(tooltip).toHaveTextContent("Other");
    expect(tooltip).not.toHaveTextContent("#");
  });
});
