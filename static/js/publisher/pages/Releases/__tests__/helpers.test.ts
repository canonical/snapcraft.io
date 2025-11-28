import { Mock } from "vitest";
import { mockRevisions } from "../../../test-utils";
import {
  ArchitectureRevisionsMap,
  Revision,
} from "../../../types/releaseTypes";
import { AVAILABLE } from "../constants";
import {
  getChannelName,
  isRevisionBuiltOnLauchpad,
  getRevisionsArchitectures,
  isSameVersion,
  getPackageMetadata,
} from "../helpers";

global.fetch = vi.fn();

const mockRevision = mockRevisions[0];

describe("getChannelName", () => {
  it("should return track/risk pair as a name", () => {
    expect(getChannelName("track", "risk")).toEqual("track/risk");
  });

  it("should return track/risk/branch pair as a name", () => {
    expect(getChannelName("track", "risk", "branch")).toEqual(
      "track/risk/branch"
    );
  });

  it("should return AVAILABLE if AVAILABLE is passed as risk", () => {
    expect(getChannelName("anything", AVAILABLE)).toEqual(AVAILABLE);
  });
});

describe("isRevisionBuiltOnLauchpad", () => {
  it("should return false for revision without build request id", () => {
    expect(isRevisionBuiltOnLauchpad(mockRevision)).toBe(false);
  });

  it("should return false for revision without Lauchpad build request id", () => {
    expect(
      isRevisionBuiltOnLauchpad({
        ...mockRevision,
        attributes: { "build-request-id": "something-else" },
      })
    ).toBe(false);
  });

  it("should return true for revision with Lauchpad build request id", () => {
    expect(
      isRevisionBuiltOnLauchpad({
        ...mockRevision,
        attributes: { "build-request-id": "lp-123" },
      })
    ).toBe(true);
  });
});

describe("getRevisionsArchitectures", () => {
  it("should return unique and sorted list of architectures from all revisoins", () => {
    const revisions: Revision[] = [
      { ...mockRevision, architectures: ["test4"] },
      { ...mockRevision, architectures: ["test2"] },
      { ...mockRevision, architectures: ["test3", "test2", "test1"] },
      { ...mockRevision, architectures: ["test3", "test4"] },
    ];
    expect(getRevisionsArchitectures(revisions)).toEqual([
      "test1",
      "test2",
      "test3",
      "test4",
    ]);
  });
});

describe("isSameVersion", () => {
  it("should return true if all revisions have same version", () => {
    const revisions: ArchitectureRevisionsMap = {
      arm64: { ...mockRevision, version: "test" },
      amd64: { ...mockRevision, version: "test" },
      powerpc: { ...mockRevision, version: "test" },
      riscv64: { ...mockRevision, version: "test" },
    };
    expect(isSameVersion(revisions)).toBe(true);
  });

  it("should return false if revisions don't have same version", () => {
    const revisions: ArchitectureRevisionsMap = {
      arm64: { ...mockRevision, version: "test" },
      amd64: { ...mockRevision, version: "test2" },
      powerpc: { ...mockRevision, version: "test" },
      riscv64: { ...mockRevision, version: "test2" },
    };
    expect(isSameVersion(revisions)).toBe(false);
  });
});

describe("getTrackGuardrails", () => {
  beforeEach(() => {
    (global.fetch as Mock).mockClear();
  });

  it("should return true when track-guardrails are present", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            "track-guardrails": ["example-guardrail"],
          },
        }),
    });

    const result = await getPackageMetadata("test-snap");
    expect(result).toStrictEqual({ "track-guardrails": ["example-guardrail"] });
  });

  it("should return false when track-guardrails are not present", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            "track-guardrails": [],
          },
        }),
    });

    const result = await getPackageMetadata("test-snap");
    expect(result).toStrictEqual({ "track-guardrails": [] });
  });
});
