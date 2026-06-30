import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Notification,
  Row,
  Col,
  Select,
} from "@canonical/react-components";
import { differenceInCalendarDays, parseISO } from "date-fns";

import {
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  buildTimestampRange,
  formatDateInputValue,
  formatReadableDate,
  formatTimeInputValue,
  getDefaultDateRange,
  getPresetDateRange,
} from "./dateRange";

import type { DatePreset } from "./dateRange";

type Props = {
  onApplyDateRange: () => void;
};

function buildSearchString(searchParams: URLSearchParams): string[] {
  const preservedParams = Array.from(searchParams.entries()).filter(
    ([key]) => !["page", "page-size", "start-time", "end-time"].includes(key),
  );

  return preservedParams.map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  );
}

function buildAppliedSearchString(
  searchParams: URLSearchParams,
  startTime: string,
  endTime: string,
): string {
  const queryParts = buildSearchString(searchParams);

  queryParts.push(`start-time=${startTime}`);
  queryParts.push(`end-time=${endTime}`);

  return `?${queryParts.join("&")}`;
}

function buildClearedSearchString(searchParams: URLSearchParams): string {
  const queryParts = buildSearchString(searchParams);

  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

function detectActivePreset(
  startTime: string | null,
  endTime: string | null,
): DatePreset {
  if (!startTime || !endTime) {
    return "last-30-days";
  }

  const presets: DatePreset[] = [
    "today",
    "yesterday",
    "last-7-days",
    "last-30-days",
  ];

  for (const preset of presets) {
    const range = getPresetDateRange(preset);
    if (!range) continue;

    const presetStart = parseISO(
      `${range.startDate}T${range.startTime}`,
    ).toISOString();
    const presetEnd = parseISO(
      `${range.endDate}T${range.endTime}`,
    ).toISOString();

    // Compare with a small tolerance for date matching
    const startMatch =
      Math.abs(
        parseISO(startTime).getTime() - parseISO(presetStart).getTime(),
      ) < 1000;
    const endMatch =
      Math.abs(parseISO(endTime).getTime() - parseISO(presetEnd).getTime()) <
      1000;

    if (startMatch && endMatch) {
      return preset;
    }
  }

  return "custom";
}

function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case "today":
      return "today";
    case "yesterday":
      return "yesterday";
    case "last-7-days":
      return "the last 7 days";
    case "last-30-days":
      return "the last 30 days";
    case "custom":
      return "a custom date range";
    default:
      return "the last 30 days";
  }
}

function SerialLogDateSelectors({
  onApplyDateRange,
}: Props): React.JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryStartTime = searchParams.get("start-time");
  const queryEndTime = searchParams.get("end-time");
  const defaultDateRange = getDefaultDateRange();
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(() =>
    detectActivePreset(queryStartTime, queryEndTime),
  );
  const [isCustomPanelOpen, setIsCustomPanelOpen] = useState(() => {
    const preset = detectActivePreset(queryStartTime, queryEndTime);
    return preset === "custom";
  });
  const [startDate, setStartDate] = useState(
    (queryStartTime ? formatDateInputValue(parseISO(queryStartTime)) : "") ||
      defaultDateRange.startDate,
  );
  const [endDate, setEndDate] = useState(
    (queryEndTime ? formatDateInputValue(parseISO(queryEndTime)) : "") ||
      defaultDateRange.endDate,
  );
  const [startTimeValue, setStartTimeValue] = useState(
    (queryStartTime ? formatTimeInputValue(parseISO(queryStartTime)) : "") ||
      DEFAULT_START_TIME,
  );
  const [endTimeValue, setEndTimeValue] = useState(
    (queryEndTime ? formatTimeInputValue(parseISO(queryEndTime)) : "") ||
      DEFAULT_END_TIME,
  );

  useEffect(() => {
    const detectedPreset = detectActivePreset(queryStartTime, queryEndTime);
    setSelectedPreset(detectedPreset);

    if (detectedPreset !== "custom") {
      setIsCustomPanelOpen(false);
    }

    if (queryStartTime && queryEndTime) {
      setStartDate(formatDateInputValue(parseISO(queryStartTime)));
      setEndDate(formatDateInputValue(parseISO(queryEndTime)));
      setStartTimeValue(formatTimeInputValue(parseISO(queryStartTime)));
      setEndTimeValue(formatTimeInputValue(parseISO(queryEndTime)));
    } else {
      // Set default 30-day range if no dates in URL
      const range = getPresetDateRange("last-30-days");
      if (range) {
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        setStartTimeValue(range.startTime);
        setEndTimeValue(range.endTime);
      }
    }
  }, [queryStartTime, queryEndTime]);

  const hasBothDates = Boolean(startDate && endDate);
  const hasBothTimes = Boolean(startTimeValue && endTimeValue);
  const hasValidDateOrder =
    hasBothDates &&
    parseISO(startDate).getTime() <= parseISO(endDate).getTime();
  const hasValidTimeOrder =
    startDate !== endDate || startTimeValue <= endTimeValue;
  const hasValidOrder = hasValidDateOrder && hasValidTimeOrder;
  const exceedsThirtyDays =
    hasValidDateOrder &&
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) > 29;
  const showValidationError =
    hasBothDates && (!hasValidOrder || exceedsThirtyDays);
  const selectedDateRangeLabel =
    selectedPreset === "custom" && hasBothDates && hasValidOrder
      ? `Showing serial logs between ${formatReadableDate(startDate)} and ${formatReadableDate(endDate)}`
      : `Showing serial logs for ${getPresetLabel(selectedPreset)}`;

  const handlePresetChange = (preset: DatePreset): void => {
    setSelectedPreset(preset);

    if (preset === "custom") {
      setIsCustomPanelOpen(true);
      return;
    }

    const range = getPresetDateRange(preset);
    if (!range) return;

    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setStartTimeValue(range.startTime);
    setEndTimeValue(range.endTime);
    setIsCustomPanelOpen(false);

    onApplyDateRange();
    if (preset === "last-30-days") {
      navigate({
        pathname,
        search: buildClearedSearchString(searchParams),
      });
      return;
    }

    const { startTime, endTime } = buildTimestampRange(
      range.startDate,
      range.startTime,
      range.endDate,
      range.endTime,
    );

    navigate({
      pathname,
      search: buildAppliedSearchString(searchParams, startTime, endTime),
    });
  };

  const handleApply = (): void => {
    if (!hasBothDates || !hasBothTimes || !hasValidOrder || exceedsThirtyDays) {
      return;
    }

    const { startTime, endTime } = buildTimestampRange(
      startDate,
      startTimeValue,
      endDate,
      endTimeValue,
    );

    setSelectedPreset("custom");
    setIsCustomPanelOpen(false);

    onApplyDateRange();
    navigate({
      pathname,
      search: buildAppliedSearchString(searchParams, startTime, endTime),
    });
  };

  const handleClose = (): void => {
    setIsCustomPanelOpen(false);
  };

  const handleReset = (): void => {
    const range = getPresetDateRange("last-30-days");
    if (!range) return;

    setSelectedPreset("last-30-days");
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setStartTimeValue(range.startTime);
    setEndTimeValue(range.endTime);
    setIsCustomPanelOpen(false);

    onApplyDateRange();
    navigate({
      pathname,
      search: buildClearedSearchString(searchParams),
    });
  };

  return (
    <>
      <Row>
        <Col size={4} medium={3}>
          <Select
            labelClassName="u-off-screen"
            id="date-range-preset"
            name="date-range-preset"
            label={selectedDateRangeLabel}
            value={selectedPreset}
            onChange={(event) =>
              handlePresetChange(event.target.value as DatePreset)
            }
            options={[
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "Last 7 days", value: "last-7-days" },
              { label: "Last 30 days", value: "last-30-days" },
              { label: "Custom", value: "custom" },
            ]}
          />
        </Col>
        <Col size={2}>
          {selectedPreset === "custom" && (
            <Button onClick={() => setIsCustomPanelOpen(true)}>Edit</Button>
          )}
        </Col>
      </Row>
      <p className="p-form-help-text">{selectedDateRangeLabel}</p>
      {isCustomPanelOpen && (
        <div className="p-strip is-shallow u-no-padding--top">
          {showValidationError && (
            <Notification severity="caution">
              {exceedsThirtyDays
                ? "The selected date range cannot exceed 30 days."
                : hasValidDateOrder
                  ? "The start time must be on or before the end time when using the same date."
                  : "The start date must be on or before the end date."}
            </Notification>
          )}
          <Row>
            <Col size={3} medium={3}>
              <label htmlFor="serial-log-start-date">Start date</label>
              <input
                id="serial-log-start-date"
                name="serial-log-start-date"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Col>
            <Col size={3} medium={3}>
              <label htmlFor="serial-log-start-time">Start time</label>
              <input
                id="serial-log-start-time"
                name="serial-log-start-time"
                type="time"
                step={1}
                value={startTimeValue}
                onChange={(event) => setStartTimeValue(event.target.value)}
              />
            </Col>
            <Row>
              <Col size={3} medium={3}>
                <label htmlFor="serial-log-end-date">End date</label>
                <input
                  id="serial-log-end-date"
                  name="serial-log-end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </Col>
              <Col size={3} medium={3}>
                <label htmlFor="serial-log-end-time">End time</label>
                <input
                  id="serial-log-end-time"
                  name="serial-log-end-time"
                  type="time"
                  step={1}
                  value={endTimeValue}
                  onChange={(event) => setEndTimeValue(event.target.value)}
                />
              </Col>
            </Row>
          </Row>
          <div className="p-strip is-shallow u-no-padding--bottom">
            <Button
              appearance="positive"
              onClick={handleApply}
              disabled={showValidationError}
            >
              Apply date range
            </Button>
            <Button onClick={handleReset}>Reset</Button>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default SerialLogDateSelectors;
