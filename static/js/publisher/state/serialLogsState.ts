import { atom } from "jotai";

import type { SerialLog } from "../types/shared";

const serialLogsListState = atom([] as SerialLog[]);

const serialLogsListFilterState = atom("" as string);

function getFilteredSerialLogs(
  serialLogs: Array<SerialLog>,
  filterQuery?: string | null,
) {
  if (!filterQuery) {
    return serialLogs;
  }

  return serialLogs.filter((serialLog: SerialLog) => {
    if (serialLog.serial && serialLog.serial.includes(filterQuery)) {
      return true;
    }

    return false;
  });
}

const filteredSerialLogsListState = atom<Array<SerialLog>>((get) => {
  const filter = get(serialLogsListFilterState);
  const SerialLogs = get(serialLogsListState);

  return getFilteredSerialLogs(SerialLogs, filter);
});

export {
  serialLogsListState,
  serialLogsListFilterState,
  filteredSerialLogsListState,
};
