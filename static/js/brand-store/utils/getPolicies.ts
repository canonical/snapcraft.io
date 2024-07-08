import type { Model } from "../types/shared";

const getPolicies = async (
  modelsList: Array<Model>,
  id: string | undefined,
  setPolicies: Function,
  setEnableTableActions?: Function
) => {
  const data = await Promise.all(
    modelsList.map((model) => {
      return fetch(`/admin/store/${id}/models/${model.name}/policies`);
    })
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
    })
  );

  setPolicies(allPolicies.flat());

  if (setEnableTableActions) {
    setEnableTableActions(true);
  }
};

export default getPolicies;
