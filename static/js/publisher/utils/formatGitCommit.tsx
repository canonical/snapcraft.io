/**
 * Formats a git commit ID for display (truncates to 7 characters)
 * @param commitId - The full git commit ID
 * @returns The truncated commit ID or null if invalid
 */
export function formatCommitId(commitId?: string | null): string | null {
  if (!commitId || typeof commitId !== "string") {
    return null;
  }

  // Git commit IDs should be at least 7 characters long
  if (commitId.length < 7) {
    return null;
  }

  return commitId.substring(0, 7);
}

/**
 * Creates a GitHub commit URL from repository and commit ID
 * @param githubRepository - The GitHub repository in format "owner/repo"
 * @param commitId - The git commit ID
 * @returns The GitHub commit URL or null if invalid
 */
export function createGitHubCommitUrl(
  githubRepository?: string | null,
  commitId?: string | null,
): string | null {
  if (!githubRepository || !commitId) {
    return null;
  }

  // Validate repository format (should be "owner/repo")
  if (
    !githubRepository.includes("/") ||
    githubRepository.split("/").length !== 2
  ) {
    return null;
  }

  return `https://github.com/${githubRepository}/commit/${commitId}`;
}

/**
 * React component for displaying a git commit ID with optional GitHub link
 * @param commitId - The git commit ID
 * @param githubRepository - The GitHub repository in format "owner/repo"
 * @param showLink - Whether to show as a clickable link (default: true)
 * @returns JSX element or null if no commit ID
 */
interface GitCommitLinkProps {
  commitId?: string | null;
  githubRepository?: string | null;
  showLink?: boolean;
}

export function GitCommitLink({
  commitId,
  githubRepository,
  showLink = true,
}: GitCommitLinkProps): React.JSX.Element | null {
  const formattedCommitId = formatCommitId(commitId);

  if (!formattedCommitId) {
    return null;
  }

  if (!showLink || !githubRepository) {
    return <span className="p-text--code">{formattedCommitId}</span>;
  }

  const commitUrl = createGitHubCommitUrl(githubRepository, commitId);

  if (!commitUrl) {
    return <span className="p-text--code">{formattedCommitId}</span>;
  }

  return (
    <a
      href={commitUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-text--code"
      title={`View commit ${formattedCommitId} on GitHub`}
    >
      {formattedCommitId}
    </a>
  );
}
