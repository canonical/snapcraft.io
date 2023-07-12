import type { Model } from "../types/shared";

function checkModelNameExists(name: string, models: Array<Model>) {
  return models.filter((model) => model.name === name).length > 0;
}

export default checkModelNameExists;
