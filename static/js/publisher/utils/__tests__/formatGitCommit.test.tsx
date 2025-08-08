import { render, screen } from "@testing-library/react";
import {
  formatCommitId,
  createGitHubCommitUrl,
  GitCommitLink,
} from "../formatGitCommit";

describe("formatCommitId", () => {
  test("formats valid commit ID to 7 characters", () => {
    const commitId = "abcdef1234567890";
    const result = formatCommitId(commitId);
    expect(result).toBe("abcdef1");
  });

  test("returns null for null input", () => {
    const result = formatCommitId(null);
    expect(result).toBeNull();
  });

  test("returns null for undefined input", () => {
    const result = formatCommitId(undefined);
    expect(result).toBeNull();
  });

  test("returns null for empty string", () => {
    const result = formatCommitId("");
    expect(result).toBeNull();
  });

  test("returns null for short commit ID", () => {
    const result = formatCommitId("abc123");
    expect(result).toBeNull();
  });

  test("returns null for non-string input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = formatCommitId(123 as any);
    expect(result).toBeNull();
  });

  test("handles exactly 7 character commit ID", () => {
    const commitId = "abcdef1";
    const result = formatCommitId(commitId);
    expect(result).toBe("abcdef1");
  });
});

describe("createGitHubCommitUrl", () => {
  test("creates valid GitHub commit URL", () => {
    const repository = "owner/repo";
    const commitId = "abcdef1234567890";
    const result = createGitHubCommitUrl(repository, commitId);
    expect(result).toBe(
      "https://github.com/owner/repo/commit/abcdef1234567890",
    );
  });

  test("returns null for null repository", () => {
    const result = createGitHubCommitUrl(null, "abcdef1234567890");
    expect(result).toBeNull();
  });

  test("returns null for null commit ID", () => {
    const result = createGitHubCommitUrl("owner/repo", null);
    expect(result).toBeNull();
  });

  test("returns null for invalid repository format", () => {
    const result = createGitHubCommitUrl("invalid-repo", "abcdef1234567890");
    expect(result).toBeNull();
  });

  test("returns null for repository with multiple slashes", () => {
    const result = createGitHubCommitUrl(
      "owner/repo/extra",
      "abcdef1234567890",
    );
    expect(result).toBeNull();
  });

  test("returns null for repository without slash", () => {
    const result = createGitHubCommitUrl("ownerrepo", "abcdef1234567890");
    expect(result).toBeNull();
  });
});

describe("GitCommitLink", () => {
  test("renders commit ID as link when repository is provided", () => {
    render(
      <GitCommitLink
        commitId="abcdef1234567890"
        githubRepository="owner/repo"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/owner/repo/commit/abcdef1234567890",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("abcdef1");
    expect(link).toHaveClass("p-text--code");
  });

  test("renders commit ID as span when repository is not provided", () => {
    render(<GitCommitLink commitId="abcdef1234567890" />);

    const span = screen.getByText("abcdef1");
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveClass("p-text--code");
  });

  test("renders commit ID as span when showLink is false", () => {
    render(
      <GitCommitLink
        commitId="abcdef1234567890"
        githubRepository="owner/repo"
        showLink={false}
      />,
    );

    const span = screen.getByText("abcdef1");
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveClass("p-text--code");
  });

  test("renders nothing when commit ID is null", () => {
    const { container } = render(<GitCommitLink commitId={null} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when commit ID is undefined", () => {
    const { container } = render(<GitCommitLink commitId={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when commit ID is too short", () => {
    const { container } = render(<GitCommitLink commitId="abc123" />);
    expect(container.firstChild).toBeNull();
  });

  test("renders span when repository format is invalid", () => {
    render(
      <GitCommitLink
        commitId="abcdef1234567890"
        githubRepository="invalid-repo"
      />,
    );

    const span = screen.getByText("abcdef1");
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveClass("p-text--code");
  });

  test("includes correct title attribute for link", () => {
    render(
      <GitCommitLink
        commitId="abcdef1234567890"
        githubRepository="owner/repo"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("title", "View commit abcdef1 on GitHub");
  });
});
