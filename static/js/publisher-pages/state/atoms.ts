import { atom } from "recoil";

import type { GithubData } from "../types";

export const buildLoggedInState = atom({
  key: "buildLoggedInstate",
  default: false,
});

export const buildRepoConnectedState = atom({
  key: "buildRepoConnectedState",
  default: false,
});

export const githubDataState = atom<GithubData | null>({
  key: "githubDataState",
  default: null,
});
