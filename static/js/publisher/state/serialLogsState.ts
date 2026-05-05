import { atom } from "jotai";

import type { SerialLog } from "../types/shared";

const serialLogsListState = atom([] as SerialLog[]);

export { serialLogsListState };
