import { BrowserRouter } from "react-router-dom";
import { useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RepoConnected from "../RepoConnected";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({ snapId: "test-snap" }),
}));

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

describe("RepoConnected", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test.each([
    { targets: ["amd64"], expected: "amd64" },
    { targets: ["arm64"], expected: "arm64" },
    { targets: ["arm64", "armhf"], expected: "arm64, armhf" },
  ])("shows target architectures: $expected", ({ targets, expected }) => {
    vi.mocked(useQuery).mockReturnValue({
      isLoading: false,
      isFetched: true,
      data: {
        snap_builds: [
          {
            id: "123",
            arch_tag: "amd64",
            target_architectures: targets,
            duration: "0:05:30",
            status: "released",
            datebuilt: null,
          },
        ],
      },
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    render(
      <BrowserRouter>
        <RepoConnected autoTriggerBuild={false} setAutoTriggerBuild={vi.fn()} />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("gridcell", { name: expected }),
    ).toBeInTheDocument();
    if (expected !== "amd64") {
      expect(
        screen.queryByRole("gridcell", { name: "amd64" }),
      ).not.toBeInTheDocument();
    }
  });
});
