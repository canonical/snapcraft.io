import { atom } from "jotai";

import { policiesListState } from "./policiesState";

import type { Remodel } from "../types/shared";

const remodelsListState = atom([] as Remodel[]);

const remodelsListFilterState = atom("" as string);

function getFilteredRemodels(
  remodels: Array<Remodel>,
  filterQuery?: string | null,
) {
  if (!filterQuery) {
    return remodels;
  }

  return remodels.filter((remodel: Remodel) => {
    if (
      (remodel["from-model"] && remodel["from-model"].includes(filterQuery)) ||
      (remodel["to-model"] && remodel["to-model"].includes(filterQuery))
    ) {
      return true;
    }

    return false;
  });
}

const filteredRemodelsListState = atom<Array<Remodel>>((get) => {
  const filter = get(remodelsListFilterState);
  const remodels = get(remodelsListState);
  const policies = get(policiesListState);
  const remodelsWithPolicies = remodels.map((remodel) => {
    const remodelSerials = policies.filter(
      (p) => p["model-name"] === remodel["to-model"],
    );

    return {
      ...remodel,
      serials: remodelSerials.length,
    };
  });

  return getFilteredRemodels(remodelsWithPolicies, filter);
});

export {
  remodelsListState,
  remodelsListFilterState,
  filteredRemodelsListState,
};
