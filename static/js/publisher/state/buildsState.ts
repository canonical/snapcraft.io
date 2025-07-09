import { atom as jotaiAtom } from "jotai";

import type { GithubData } from "../types";

export const buildLoggedInState = jotaiAtom(false);

export const buildRepoConnectedState = jotaiAtom(false);

export const githubDataState = jotaiAtom<GithubData | null>(null);
