import type { Model as ModelType } from "../types/shared";

function checkModelNameExists(name: string, models: Array<ModelType>): boolean {
  return models.filter((model) => model.name === name).length > 0;
}

export default checkModelNameExists;
