import { Dispatch, SetStateAction } from "react";
import { useSetAtom } from "jotai";

import { policiesListState } from "../state/policiesState";

import type { Model as ModelType } from "../types/shared";

type Options = {
  models: ModelType[];
  id: string | undefined;
  signal?: AbortSignal;
  setEnableTableActions?: Dispatch<SetStateAction<boolean>>;
};

const getPolicies = async ({
  models,
  id,
  signal,
  setEnableTableActions,
}: Options) => {
  const setPolicies = useSetAtom(policiesListState);
  const data = await Promise.all(
    models.map((model) => {
      return fetch(`/api/store/${id}/models/${model.name}/policies`, {
        signal,
      });
    }),
  );

  const allPolicies = await Promise.all(
    data.map(async (res) => {
      if (!res.ok) {
        return [];
      }

      const policies = await res.json();

      if (!policies.success) {
        return [];
      }

      return policies.data;
    }),
  );

  setPolicies(allPolicies.flat());

  if (setEnableTableActions) {
    setEnableTableActions(true);
  }
};

export default getPolicies;
