import { atom } from "jotai";

import { ValidationSet } from "../types";

const validationSetsState = atom([] as ValidationSet[]);

export { validationSetsState };
