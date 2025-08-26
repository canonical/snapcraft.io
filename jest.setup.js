import { TextEncoder, TextDecoder } from "node:util";
import "@testing-library/jest-dom";

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
