import { atom } from "jotai";

import type { Publisher } from "../types/shared";

const publisherState = atom(null as Publisher);

export { publisherState };
