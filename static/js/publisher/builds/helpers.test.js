import { createDuration, createStatus } from "./helpers";

describe("createDuration", () => {
  it("should return empty string if no duration argument", () => {
    expect(createDuration()).toEqual("");
  });

  it("should return the number of hours", () => {
    const duration = "3:59:20";
    expect(createDuration(duration)).toEqual("3 hours");
  });

  it("should return the number of minutes", () => {
    const duration = "00:59:20";
    expect(createDuration(duration)).toEqual("59 minutes");
  });

  it("should return the number of seconds", () => {
    const duration = "00:00:20";
    expect(createDuration(duration)).toEqual("20 seconds");
  });
});

describe("createStatus", () => {
  it("should return a valid status object with icon classes", () => {
    const statusObject = {
      badge: "releasing_soon",
      icon: "spinner u-animation--spin",
      priority: 3,
      shortStatusMessage: "Releasing",
      statusMessage: "Built, releasing soon",
    };
    expect(
      createStatus("Built, releasing soon", "Releasing", 3, "releasing_soon"),
    ).toEqual(statusObject);
  });

  it("should return a valid status object with no icon", () => {
    const statusObject = {
      badge: "cancelled",
      icon: undefined,
      priority: 8,
      shortStatusMessage: "Cancelled",
      statusMessage: "Cancelled",
    };
    expect(createStatus("Cancelled", "Cancelled", 8, "cancelled")).toEqual(
      statusObject,
    );
  });
});
