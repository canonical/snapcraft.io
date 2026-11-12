import { webcrypto } from "node:crypto";

import generateModelApiKey, {
  MODEL_API_KEY_LENGTH,
} from "../generateModelApiKey";

describe("generateModelApiKey", () => {
  it("propagates Web Crypto failures instead of generating an insecure key", () => {
    // Vitest uses Nano ID's Node entry point, which pools secure random bytes.
    const error = new Error("Secure randomness unavailable");
    const getRandomValues = vi
      .spyOn(webcrypto, "getRandomValues")
      .mockImplementation(() => {
        throw error;
      });

    try {
      expect(() => {
        // Exhaust any already-filled pool so the failed entropy source is used.
        for (let i = 0; i < 1000; i++) {
          generateModelApiKey();
        }
      }).toThrow(error);
      expect(getRandomValues).toHaveBeenCalled();
    } finally {
      getRandomValues.mockRestore();
    }
  });

  it("generates exactly 50 mixed-case alphanumeric characters", () => {
    expect(MODEL_API_KEY_LENGTH).toBe(50);
    for (let i = 0; i < 100; i++) {
      const apiKey = generateModelApiKey();
      expect(apiKey).toHaveLength(50);
      expect(apiKey).toMatch(/^[0-9a-zA-Z]{50}$/);
    }
  });
});
