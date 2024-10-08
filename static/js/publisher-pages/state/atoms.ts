import { atom } from "recoil";

export const buildLoggedInState = atom({
  key: "buildLoggedInstate",
  default: false,
});

export const buildRepoConnectedState = atom({
  key: "buildRepoConnectedState",
  default: false,
});

export const githubDataState = atom({
  key: "githubDataState",
  default: null,
});
