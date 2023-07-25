import { useQuery } from "react-query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useModels(id: string | undefined) {
  return useQuery("models", async () => {
    const response = await fetch(`/admin/store/${id}/models`);

    if (!response.ok) {
      throw new Error("There was a problem fetching models");
    }

    const modelsData = await response.json();

    if (!modelsData.success) {
      throw new Error(modelsData.message);
    }

    return modelsData.data;
  });
}

export function usePolicies(
  id: string | undefined,
  modelId: string | undefined
) {
  return useQuery("policies", async () => {
    const response = await fetch(
      `/admin/store/${id}/models/${modelId}/policies`
    );

    if (!response.ok) {
      throw new Error("There was a problem fetching policies");
    }

    const policiesData = await response.json();

    if (!policiesData.success) {
      throw new Error(policiesData.message);
    }

    return policiesData.data;
  });
}

export function useSigningKeys(id: string | undefined) {
  return useQuery("signingKeys", async () => {
    const response = await fetch(`/admin/store/${id}/signing-keys`);

    if (!response.ok) {
      throw new Error("There was a problem fetching signing keys");
    }

    const signingKeysData = await response.json();

    if (!signingKeysData.success) {
      throw new Error(signingKeysData.message);
    }

    return signingKeysData.data;
  });
}
