import { atom } from "jotai";

import type { SerialLog } from "../types/shared";

const serialLogListState = atom([] as SerialLog[]);

const serialLogListFilterState = atom("" as string);

function getFilteredSerialLogs(
  serialLogs: Array<SerialLog>,
  filterQuery?: string | null,
) {
  if (!filterQuery) {
    return serialLogs;
  }

  return serialLogs.filter((serialLog: SerialLog) => {
    if (
      (serialLog["brand-id"] && serialLog["brand-id"].includes(filterQuery)) ||
      (serialLog["model-name"] &&
        serialLog["model-name"].includes(filterQuery)) ||
      (serialLog.serial && serialLog.serial.includes(filterQuery))
    ) {
      return true;
    }

    return false;
  });
}

const filteredSerialLogsListState = atom<Array<SerialLog>>((get) => {
  const filter = get(serialLogListFilterState);
  const serialLogs = get(serialLogListState);

  return getFilteredSerialLogs(serialLogs, filter);
});

export {
  serialLogListState,
  serialLogListFilterState,
  filteredSerialLogsListState,
};
