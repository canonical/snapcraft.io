import { customAlphabet } from "nanoid";

export const MODEL_API_KEY_LENGTH = 50;

// Use Nano ID's secure entry point and rejection sampling, not nanoid/non-secure.
const generateKey = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  MODEL_API_KEY_LENGTH,
);

function generateModelApiKey(): string {
  return generateKey();
}

export default generateModelApiKey;
