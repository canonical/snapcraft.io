import { atom } from "jotai";

import type { Remodel } from "../types/shared";

const remodelsListState = atom([] as Remodel[]);

export { remodelsListState };
