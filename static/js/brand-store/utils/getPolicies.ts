import { Dispatch, SetStateAction } from "react";
import { SetterOrUpdater } from "recoil";
import type { Model as ModelType, Policy } from "../types/shared";

type Options = {
  models: ModelType[];
  id: string | undefined;
  setPolicies: SetterOrUpdater<Policy[]>;
  signal?: AbortSignal;
  setEnableTableActions?: Dispatch<SetStateAction<boolean>>;
};

const getPolicies = async ({
  models,
  id,
  setPolicies,
  signal,
  setEnableTableActions,
}: Options) => {
  const data = await Promise.all(
    models.map((model) => {
      return fetch(`/admin/store/${id}/models/${model.name}/policies`, {
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
