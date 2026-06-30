import { describe, expect, it, vi } from "vitest";

import {
  buildTimestampRange,
  formatDateInputValue,
  formatReadableDate,
  formatTimeInputValue,
  getDefaultDateRange,
  getPresetDateRange,
  getPresetTimestampRange,
} from "../dateRange";

describe("dateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T14:34:23.666Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date and time input values", () => {
    const date = new Date("2026-05-01T12:13:14.000Z");

    expect(formatDateInputValue(date)).toBe("2026-05-01");
    expect(formatTimeInputValue(date)).toBe("12:13:14");
    expect(formatReadableDate("2026-05-01")).toBe("1 May, 2026");
  });

  it("returns the default inclusive 30 day date range", () => {
    expect(getDefaultDateRange()).toEqual({
      startDate: "2026-05-04",
      endDate: "2026-06-02",
    });
  });

  it("returns date ranges for supported presets", () => {
    expect(getPresetDateRange("today")).toEqual({
      startDate: "2026-06-02",
      endDate: "2026-06-02",
      startTime: "00:00:00",
      endTime: "23:59:59",
    });
    expect(getPresetDateRange("yesterday")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-01",
      startTime: "00:00:00",
      endTime: "23:59:59",
    });
    expect(getPresetDateRange("last-7-days")).toEqual({
      startDate: "2026-05-27",
      endDate: "2026-06-02",
      startTime: "00:00:00",
      endTime: "23:59:59",
    });
    expect(getPresetDateRange("last-30-days")).toEqual({
      startDate: "2026-05-04",
      endDate: "2026-06-02",
      startTime: "00:00:00",
      endTime: "23:59:59",
    });
    expect(getPresetDateRange("custom")).toBeNull();
  });

  it("builds ISO timestamp ranges", () => {
    expect(
      buildTimestampRange("2026-05-01", "12:13:14", "2026-05-10", "20:21:22"),
    ).toEqual({
      startTime: "2026-05-01T12:13:14.000Z",
      endTime: "2026-05-10T20:21:22.000Z",
    });
  });

  it("returns timestamp ranges for supported presets", () => {
    expect(getPresetTimestampRange("last-7-days")).toEqual({
      startTime: "2026-05-27T00:00:00.000Z",
      endTime: "2026-06-02T23:59:59.000Z",
    });
    expect(getPresetTimestampRange("custom")).toBeNull();
  });
});
