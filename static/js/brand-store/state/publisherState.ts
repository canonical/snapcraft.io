import { atom } from "recoil";
import type { Publisher } from "../types/shared";

const publisherState = atom({
  key: "publisher",
  default: null as Publisher,
});

export { publisherState };
