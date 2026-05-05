import { useState, useEffect } from "react";

const useEndpointAvailability = (
  brandId: string | undefined,
  modelId: string | undefined,
): {
  isRemodelAvailable: boolean;
  isSerialLogAvailable: boolean;
} => {
  const [isRemodelAvailable, setIsRemodelAvailable] = useState(false);
  const [isSerialLogAvailable, setIsSerialLogAvailable] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const checkEndpointAvailability = async () => {
      if (!brandId && !modelId) {
        if (!signal.aborted) {
          setIsRemodelAvailable(false);
          setIsSerialLogAvailable(false);
        }

        return;
      }

      const remodelUrl = `/api/store/${brandId}/models/remodel-allowlist`;
      const serialLogUrl = `/api/store/${brandId}/models/${modelId}/serial-log`;

      const remodelPromise = fetch(remodelUrl, { method: "HEAD", signal })
        .then((response) => ({ success: true, ok: response.ok }))
        .catch(() => ({ success: false, ok: false }));

      const serialLogPromise = fetch(serialLogUrl, { method: "HEAD", signal })
        .then((response) => ({ success: true, ok: response.ok }))
        .catch(() => ({ success: false, ok: false }));

      const results = await Promise.allSettled([
        remodelPromise,
        serialLogPromise,
      ]);

      if (!signal.aborted) {
        const remodelResult =
          results[0].status === "fulfilled"
            ? results[0].value
            : { success: false, ok: false };
        const serialLogResult =
          results[1].status === "fulfilled"
            ? results[1].value
            : { success: false, ok: false };

        setIsRemodelAvailable(remodelResult.ok);
        setIsSerialLogAvailable(modelId ? serialLogResult.ok : false);
      }
    };

    checkEndpointAvailability();

    return () => {
      abortController.abort();
    };
  }, [brandId, modelId]);

  return {
    isRemodelAvailable,
    isSerialLogAvailable,
  };
};

export default useEndpointAvailability;
