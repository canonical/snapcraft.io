import { atom as jotaiAtom } from "jotai";

import type { Publisher } from "../types/shared";

const publisherState = jotaiAtom(null as Publisher);

export { publisherState };
