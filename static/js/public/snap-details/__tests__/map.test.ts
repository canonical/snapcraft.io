import { vi, type MockInstance } from "vitest";

import world from "../../../world-110m.v1.json";
import renderMap from "../map";
import type { TerritoriesMetricsData } from "../../../publisher/types/shared";

const snapData: TerritoriesMetricsData = {
  "004": {
    code: "AF",
    color_rgb: [10, 20, 30],
    name: "Afghanistan",
    number_of_users: 42,
    percentage_of_users: 100,
  },
};

const fetchMock = vi.fn<typeof fetch>();
let addEventListenerSpy: MockInstance<typeof window.addEventListener>;
let mapEl: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  addEventListenerSpy = vi.spyOn(window, "addEventListener");
  document.body.innerHTML = '<div id="map">Loading map</div>';
  mapEl = document.querySelector<HTMLDivElement>("#map")!;
  Object.defineProperty(mapEl, "clientWidth", {
    value: 800,
    configurable: true,
  });
});

afterEach(() => {
  for (const [type, listener, options] of addEventListenerSpy.mock.calls) {
    if (type === "resize") {
      window.removeEventListener(type, listener, options);
    }
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("renderMap", () => {
  test("fetches world JSON and renders countries, boundaries and tooltips", async () => {
    const response = new Response(JSON.stringify(world));
    const jsonSpy = vi.spyOn(response, "json");
    fetchMock.mockResolvedValue(response);

    await renderMap("#map", snapData);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/static/js/world-110m.v1.json",
    );
    expect(jsonSpy).toHaveBeenCalledOnce();
    expect(mapEl.textContent).not.toContain("Loading map");
    const svg = mapEl.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("800");
    expect(svg.getAttribute("height")).toBe("400");
    expect(
      svg.querySelectorAll(".snapcraft-territories__country"),
    ).toHaveLength(world.objects.countries.geometries.length);
    expect(
      svg.querySelector(".snapcraft-territories__boundary")?.getAttribute("d"),
    ).toBeTruthy();

    const country = svg.querySelector<SVGPathElement>('[id="004"]')!;
    expect(country.classList).toContain(
      "snapcraft-territories__country-default",
    );
    expect(country.style.fill).toBe("rgb(10,20,30)");
    expect(country.getAttribute("d")).toBeTruthy();
    const unpopulatedCountry = svg.querySelector('[id="024"]')!;
    expect(unpopulatedCountry.classList).not.toContain(
      "snapcraft-territories__country-default",
    );
    expect(unpopulatedCountry.getAttribute("style")).toBeNull();

    country.dispatchEvent(new MouseEvent("mousemove"));
    const tooltip = mapEl.querySelector<HTMLDivElement>(
      ".snapcraft-territories__tooltip",
    )!;
    expect(tooltip.style.display).toBe("block");
    expect(tooltip.textContent).toContain("Afghanistan");
    expect(tooltip.textContent).toContain("42 active");
    country.dispatchEvent(new MouseEvent("mouseout"));
    expect(tooltip.style.display).toBe("none");
  });

  test("redraws on resize using the fetched world without another request", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(world)));
    await renderMap("#map", snapData);
    const firstSvg = mapEl.querySelector("svg");
    Object.defineProperty(mapEl, "clientWidth", { value: 600 });

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(99);
    expect(mapEl.querySelector("svg")).toBe(firstSvg);
    vi.advanceTimersByTime(1);

    const resizedSvg = mapEl.querySelector("svg")!;
    expect(resizedSvg).not.toBe(firstSvg);
    expect(resizedSvg.getAttribute("width")).toBe("600");
    expect(resizedSvg.getAttribute("height")).toBe("300");
    expect(mapEl.querySelectorAll("svg")).toHaveLength(1);
    expect(
      resizedSvg.querySelectorAll(".snapcraft-territories__country"),
    ).toHaveLength(world.objects.countries.geometries.length);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test.each([
    [404, "Not Found"],
    [500, "Internal Server Error"],
  ])(
    "rejects HTTP %s before parsing JSON or rendering",
    async (status, statusText) => {
      const response = new Response(JSON.stringify(world), {
        status,
        statusText,
      });
      const jsonSpy = vi.spyOn(response, "json");
      fetchMock.mockResolvedValue(response);

      await expect(renderMap("#map", snapData)).rejects.toThrow(
        new Error(`Error: ${status} ${statusText}`),
      );

      expect(jsonSpy).not.toHaveBeenCalled();
      expect(mapEl.innerHTML).toBe("Loading map");
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    },
  );

  test("propagates network errors with the existing error wrapping", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(renderMap("#map", snapData)).rejects.toThrow(
      new Error("TypeError: Failed to fetch"),
    );

    expect(mapEl.innerHTML).toBe("Loading map");
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  test("propagates JSON parsing errors without rendering", async () => {
    fetchMock.mockResolvedValue(new Response("not JSON"));

    await expect(renderMap("#map", snapData)).rejects.toThrow(/SyntaxError/);

    expect(mapEl.innerHTML).toBe("Loading map");
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  test.each([204, 205])(
    "skips JSON parsing for HTTP %s as d3.json did",
    async (status) => {
      const response = new Response(null, { status });
      const jsonSpy = vi.spyOn(response, "json");
      fetchMock.mockResolvedValue(response);

      // Empty responses still fail in the renderer because no world was supplied.
      await expect(renderMap("#map", snapData)).rejects.toThrow(/TypeError/);

      expect(jsonSpy).not.toHaveBeenCalled();
      expect(
        mapEl.querySelectorAll(".snapcraft-territories__country"),
      ).toHaveLength(0);
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    },
  );
});
