import type { Model } from "../types/shared";

function getFilteredModels(models: Array<Model>, filterQuery?: string | null) {
  if (!filterQuery) {
    return models;
  }

  return models.filter((model: Model) => {
    if (
      model.name.includes(filterQuery) ||
      model["api-key"].includes(filterQuery) ||
      model["created-at"].includes(filterQuery) ||
      model["modified-at"].includes(filterQuery)
    ) {
      return true;
    }

    return false;
  });
}

export default getFilteredModels;
