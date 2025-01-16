import { useQuery, UseQueryResult } from "react-query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../state/store";
import type { Model as ModelType, SigningKey, Policy } from "../types/shared";

import useBrandStores from "./useBrandStores";
import useSnaps from "./useSnaps";
import useMembers from "./useMembers";
import useInvites from "./useInvites";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export interface ApiError {
  message: string;
}

export interface UsePoliciesResponse {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  data: Policy[] | undefined;
}

export function usePolicies(
  brandId: string | undefined,
  modelId: string | undefined,
): UsePoliciesResponse {
  return useQuery<Policy[], ApiError>({
    queryKey: ["policies", brandId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/${modelId}/policies`,
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

export const useSigningKeys = (
  brandId: string | undefined,
): UseQueryResult<SigningKey[], Error> => {
  return useQuery<SigningKey[], Error>({
    queryKey: ["signingKeys", brandId],
    queryFn: async () => {
      const response = await fetch(`/api/store/${brandId}/signing-keys`);

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
};

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const response = await fetch(`/api/store/${id}/brand`);

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

export const useModels = (
  brandId: string | undefined,
): UseQueryResult<ModelType[], Error> => {
  return useQuery<ModelType[], Error>({
    queryKey: ["models", brandId],
    queryFn: async () => {
      const response = await fetch(`/api/store/${brandId}/models`);

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
};

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

export { useBrandStores, useSnaps, useMembers, useInvites };
