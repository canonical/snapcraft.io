import {
  tourStartedByUser,
  tourStartedAutomatically,
  tourFinished,
  tourSkipped
} from "./metricsEvents";
import { triggerEvent } from "../../base/ga";

jest.mock("../../base/ga");

describe("metricsEvents", () => {
  describe("tourStartedByUser", () => {
    it("should trigger GA tour-started-by-user event", () => {
      tourStartedByUser();
      expect(triggerEvent).toBeCalledWith(
        "tour-started-by-user",
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("tourStartedAutomatically", () => {
    it("should trigger GA tour-started-automatically event", () => {
      tourStartedAutomatically();
      expect(triggerEvent).toBeCalledWith(
        "tour-started-automatically",
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("tourFinished", () => {
    it("should trigger GA tour-finished event with step id", () => {
      tourFinished("test-step");
      expect(triggerEvent).toBeCalledWith(
        "tour-finished",
        expect.anything(),
        expect.anything(),
        expect.stringContaining("test-step")
      );
    });
  });

  describe("tourSkipped", () => {
    it("should trigger GA tour-skipped event with step id", () => {
      tourSkipped("test-step");
      expect(triggerEvent).toBeCalledWith(
        "tour-skipped",
        expect.anything(),
        expect.anything(),
        expect.stringContaining("test-step")
      );
    });
  });
});
