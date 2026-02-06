import { Dispatch, SetStateAction } from "react";

import type { Policy } from "../types/shared";

type Options = {
  modelIds: string[];
  id: string | undefined;
  setPolicies: Dispatch<SetStateAction<Policy[]>>;
  signal?: AbortSignal;
  setEnableTableActions?: Dispatch<SetStateAction<boolean>>;
};

const getPolicies = async ({
  modelIds,
  id,
  setPolicies,
  signal,
  setEnableTableActions,
}: Options) => {
  const data = await Promise.all(
    modelIds.map((modelId) => {
      return fetch(`/api/store/${id}/models/${modelId}/policies`, {
        signal,
      });
    }),
  ).catch((e: Error) => {
    if (e instanceof DOMException && e.name == "AbortError") {
      // swallow the error because it's actually deliberate
    } else {
      console.error(e);
    }
  });

  console.log("modelIds", modelIds);

  if (!data) return;

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
