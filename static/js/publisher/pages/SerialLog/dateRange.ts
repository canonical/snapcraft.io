import { format, parseISO, subDays } from "date-fns";

export type DatePreset =
  | "today"
  | "yesterday"
  | "last-7-days"
  | "last-30-days"
  | "custom";

export const DEFAULT_START_TIME = "00:00:00";
export const DEFAULT_END_TIME = "23:59:59";

export function formatDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatTimeInputValue(date: Date): string {
  return format(date, "HH:mm:ss");
}

export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();

  return {
    startDate: formatDateInputValue(subDays(today, 29)),
    endDate: formatDateInputValue(today),
  };
}

export function formatReadableDate(dateValue: string): string {
  const date = parseISO(dateValue);

  return format(date, "d MMMM, yyyy");
}

export function buildTimestampRange(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): {
  startTime: string;
  endTime: string;
} {
  const startTimeValue = parseISO(`${startDate}T${startTime}`).toISOString();
  const endTimeValue = parseISO(`${endDate}T${endTime}`).toISOString();

  return { startTime: startTimeValue, endTime: endTimeValue };
}

export function getPresetDateRange(preset: DatePreset): {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
} | null {
  const today = new Date();

  switch (preset) {
    case "today":
      return {
        startDate: formatDateInputValue(today),
        endDate: formatDateInputValue(today),
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
      };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return {
        startDate: formatDateInputValue(yesterday),
        endDate: formatDateInputValue(yesterday),
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
      };
    }
    case "last-7-days":
      return {
        startDate: formatDateInputValue(subDays(today, 6)),
        endDate: formatDateInputValue(today),
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
      };
    case "last-30-days":
      return {
        startDate: formatDateInputValue(subDays(today, 29)),
        endDate: formatDateInputValue(today),
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
      };
    default:
      return null;
  }
}

export function getPresetTimestampRange(preset: DatePreset): {
  startTime: string;
  endTime: string;
} | null {
  const range = getPresetDateRange(preset);

  if (!range) {
    return null;
  }

  return buildTimestampRange(
    range.startDate,
    range.startTime,
    range.endDate,
    range.endTime,
  );
}
