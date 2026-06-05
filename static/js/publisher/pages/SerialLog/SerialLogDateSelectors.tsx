import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Notification, Row, Col } from "@canonical/react-components";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

type Props = {
  onApplyDateRange: () => void;
};

const DEFAULT_START_TIME = "00:00:00";
const DEFAULT_END_TIME = "23:59:59";

function formatDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatTimeInputValue(date: Date): string {
  return format(date, "HH:mm:ss");
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();

  return {
    startDate: formatDateInputValue(subDays(today, 29)),
    endDate: formatDateInputValue(today),
  };
}

function formatReadableDate(dateValue: string): string {
  const date = parseISO(dateValue);

  return format(date, "d MMMM, yyyy");
}

function buildTimestampRange(
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

function SerialLogDateSelectors({
  onApplyDateRange,
}: Props): React.JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryStartTime = searchParams.get("start-time");
  const queryEndTime = searchParams.get("end-time");
  const shouldStartOpen = Boolean(queryStartTime && queryEndTime);
  const defaultDateRange = getDefaultDateRange();
  const [isOpen, setIsOpen] = useState(shouldStartOpen);
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
    if (queryStartTime && queryEndTime) {
      setIsOpen(true);
      setStartDate(formatDateInputValue(parseISO(queryStartTime)));
      setEndDate(formatDateInputValue(parseISO(queryEndTime)));
      setStartTimeValue(formatTimeInputValue(parseISO(queryStartTime)));
      setEndTimeValue(formatTimeInputValue(parseISO(queryEndTime)));
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
    hasBothDates && hasValidOrder
      ? `Showing serial logs between ${formatReadableDate(startDate)} and ${formatReadableDate(endDate)}`
      : "Showing serial logs between selected dates";

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

    onApplyDateRange();
    navigate({
      pathname,
      search: buildAppliedSearchString(searchParams, startTime, endTime),
    });
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setStartDate(defaultDateRange.startDate);
    setEndDate(defaultDateRange.endDate);
    setStartTimeValue(DEFAULT_START_TIME);
    setEndTimeValue(DEFAULT_END_TIME);
    onApplyDateRange();
    navigate({
      pathname,
      search: buildClearedSearchString(searchParams),
    });
  };

  return (
    <>
      {!isOpen ? (
        <Row>
          <Col size={6} medium={3}>
            <p>Showing serial logs for the past 30 days</p>
          </Col>
          <Col size={6} medium={3} className="u-align--right">
            <Button onClick={() => setIsOpen(true)}>
              Select custom date range
            </Button>
          </Col>
        </Row>
      ) : (
        <div className="p-strip is-shallow u-no-padding--top">
          <p>{selectedDateRangeLabel}</p>
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
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default SerialLogDateSelectors;
