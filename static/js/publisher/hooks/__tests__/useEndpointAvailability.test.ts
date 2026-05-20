import { renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, vi } from "vitest";
import "@testing-library/jest-dom";

import useEndpointAvailability from "../useEndpointAvailability";

const mockFetch = vi.fn();

describe("useEndpointAvailability", () => {
  beforeAll(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("returns false for both endpoints when brandId is undefined", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() =>
      useEndpointAvailability(undefined, "test-model-id"),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(false);
      expect(result.current.isSerialLogAvailable).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/undefined/models/remodel-allowlist",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/undefined/models/test-model-id/serial-log",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("returns false for both endpoints when both brandId and modelId are undefined", async () => {
    const { result } = renderHook(() =>
      useEndpointAvailability(undefined, undefined),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(false);
      expect(result.current.isSerialLogAvailable).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns false for serial log when modelId is undefined", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useEndpointAvailability("test-brand-id", undefined),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(true);
      expect(result.current.isSerialLogAvailable).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/test-brand-id/models/remodel-allowlist",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/test-brand-id/models/undefined/serial-log",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("makes HEAD requests to both endpoints when both IDs are provided", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useEndpointAvailability("test-brand-id", "test-model-id"),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(true);
      expect(result.current.isSerialLogAvailable).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/test-brand-id/models/remodel-allowlist",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/test-brand-id/models/test-model-id/serial-log",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("handles remodel endpoint failure", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() =>
      useEndpointAvailability("test-brand-id", "test-model-id"),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(false);
      expect(result.current.isSerialLogAvailable).toBe(true);
    });
  });

  it("handles serial log endpoint failure", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() =>
      useEndpointAvailability("test-brand-id", "test-model-id"),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(true);
      expect(result.current.isSerialLogAvailable).toBe(false);
    });
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useEndpointAvailability("test-brand-id", "test-model-id"),
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(false);
      expect(result.current.isSerialLogAvailable).toBe(false);
    });
  });

  it("re-runs checks when brandId changes", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result, rerender } = renderHook(
      ({ brandId, modelId }) => useEndpointAvailability(brandId, modelId),
      {
        initialProps: { brandId: "brand-1", modelId: "model-1" },
      },
    );

    await waitFor(() => {
      expect(result.current.isRemodelAvailable).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Change brandId
    rerender({ brandId: "brand-2", modelId: "model-1" });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/brand-2/models/remodel-allowlist",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/store/brand-2/models/model-1/serial-log",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("re-runs checks when modelId changes", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result, rerender } = renderHook(
      ({ brandId, modelId }) => useEndpointAvailability(brandId, modelId),
      {
        initialProps: { brandId: "brand-1", modelId: "model-1" },
      },
    );

    await waitFor(() => {
      expect(result.current.isSerialLogAvailable).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Change modelId
    rerender({ brandId: "brand-1", modelId: "model-2" });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/store/brand-1/models/model-2/serial-log",
      expect.objectContaining({
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
