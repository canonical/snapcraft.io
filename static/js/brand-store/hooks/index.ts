import { useQuery } from "react-query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function usePolicies(
  brandId: string | undefined,
  modelId: string | undefined
) {
  return useQuery({
    queryKey: ["policies", brandId],
    queryFn: async () => {
      const response = await fetch(
        `/admin/store/${brandId}/models/${modelId}/policies`
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching policies");
      }

      const policiesData = await response.json();

      if (!policiesData.success) {
        throw new Error(policiesData.message);
      }

      return policiesData.data;
    },
  });
}

export function useSigningKeys(brandId: string | undefined) {
  return useQuery({
    queryKey: ["signingKeys", brandId],
    queryFn: async () => {
      const response = await fetch(`/admin/store/${brandId}/signing-keys`);

      if (!response.ok) {
        throw new Error("There was a problem fetching signing keys");
      }

      const signingKeysData = await response.json();

      if (!signingKeysData.success) {
        throw new Error(signingKeysData.message);
      }

      return signingKeysData.data;
    },
  });
}

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const response = await fetch(`/admin/store/${id}/brand`);

      if (!response.ok) {
        throw new Error("There was a problem fetching models");
      }

      const brandData = await response.json();

      if (!brandData.success) {
        throw new Error(brandData.message);
      }

      return brandData.data;
    },
  });
}

export function useModels(brandId: string | undefined) {
  return useQuery({
    queryKey: ["models", brandId],
    queryFn: async () => {
      const response = await fetch(`/admin/store/${brandId}/models`);

      if (!response.ok) {
        throw new Error("There was a problem fetching models");
      }

      const modelsData = await response.json();

      if (!modelsData.success) {
        throw new Error(modelsData.message);
      }

      return modelsData.data;
    },
    enabled: !!brandId,
  });
}

export function usePublisher() {
  return useQuery("publisher", async () => {
    const response = await fetch("/account.json");

    if (!response.ok) {
      return {
        publisher: null,
      };
    }

    const publisherData = await response.json();

    return publisherData;
  });
}
