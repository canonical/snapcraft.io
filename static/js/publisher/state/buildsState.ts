import { atom } from "jotai";

import type { GithubData } from "../types";

export const buildLoggedInState = atom(false);

export const buildRepoConnectedState = atom(false);

export const githubDataState = atom<GithubData | null>(null);
