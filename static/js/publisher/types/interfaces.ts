import type { Policy } from "../types/shared";

export interface UsePoliciesResponse {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  data: Policy[] | undefined;
}

export interface ApiError {
  message: string;
}
