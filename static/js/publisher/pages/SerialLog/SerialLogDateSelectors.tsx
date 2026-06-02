import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Notification, Row, Col } from "@canonical/react-components";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

type Props = {
  onApplyDateRange: () => void;
};

function formatDateInputValue(date: Date): string {
  // HTML date inputs require a YYYY-MM-DD value; slice extracts that from ISO.
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();

  return {
    startDate: formatDateInputValue(subDays(today, 30)),
    endDate: formatDateInputValue(today),
  };
}

function getDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  // HTML date inputs require a YYYY-MM-DD value; slice extracts that from ISO.
  return value.slice(0, 10);
}

function formatReadableDate(dateValue: string): string {
  const date = parseISO(dateValue);

  return format(date, "d MMMM, yyyy");
}

function buildTimestampRange(
  startDate: string,
  endDate: string,
): {
  startTime: string;
  endTime: string;
} {
  const startTime = `${startDate}T00:00:00.000Z`;
  const endTime = `${endDate}T23:59:59.000Z`;

  return { startTime, endTime };
}

function buildSearchString(searchParams: URLSearchParams): string[] {
  const preservedParams = Array.from(searchParams.entries()).filter(
    ([key]) => !["page", "page-size", "start-time", "end-time"].includes(key),
  );

  return preservedParams.map(([key, value]) => `${key}=${value}`);
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
  const startTime = searchParams.get("start-time");
  const endTime = searchParams.get("end-time");
  const shouldStartOpen = Boolean(startTime && endTime);
  const defaultDateRange = getDefaultDateRange();
  const [isOpen, setIsOpen] = useState(shouldStartOpen);
  const [startDate, setStartDate] = useState(
    getDateInputValue(startTime) || defaultDateRange.startDate,
  );
  const [endDate, setEndDate] = useState(
    getDateInputValue(endTime) || defaultDateRange.endDate,
  );

  useEffect(() => {
    if (startTime && endTime) {
      setIsOpen(true);
      setStartDate(getDateInputValue(startTime));
      setEndDate(getDateInputValue(endTime));
    }
  }, [startTime, endTime]);

  const hasBothDates = Boolean(startDate && endDate);
  const hasValidOrder =
    hasBothDates &&
    parseISO(startDate).getTime() <= parseISO(endDate).getTime();
  const exceedsThirtyDays =
    hasValidOrder &&
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) > 30;
  const showValidationError =
    hasBothDates && (!hasValidOrder || exceedsThirtyDays);
  const selectedDateRangeLabel =
    hasBothDates && hasValidOrder
      ? `Showing serial logs between ${formatReadableDate(startDate)} and ${formatReadableDate(endDate)}`
      : "Showing serial logs between selected dates";

  const handleApply = (): void => {
    if (!hasBothDates || !hasValidOrder || exceedsThirtyDays) {
      return;
    }

    const { startTime, endTime } = buildTimestampRange(startDate, endDate);

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
          <Row>
            <Col size={4}>
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
            <Col size={4}>
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
          {showValidationError && (
            <Notification severity="caution">
              {hasValidOrder
                ? "The selected date range cannot exceed 30 days."
                : "The start date must be on or before the end date."}
            </Notification>
          )}
        </div>
      )}
    </>
  );
}

export default SerialLogDateSelectors;
