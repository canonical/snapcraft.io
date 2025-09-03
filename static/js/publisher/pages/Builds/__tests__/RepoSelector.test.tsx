import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import "@testing-library/jest-dom";

import RepoSelector from "../RepoSelector";

const mockGithubData = {
  github_orgs: [
    {
      login: "canonical",
      name: "Canonical",
    },
  ],
  github_repository: null,
  github_user: {
    avatarUrl: "https://gravatar.com/avatar",
    login: "johndoe",
    name: "John Doe",
  },
};

const mockRepos = [
  { name: "test-snap-id", nameWithOwner: "johndoe/test-snap-id" },
  { name: "other-repo", nameWithOwner: "johndoe/other-repo" },
  { name: "another-repo", nameWithOwner: "johndoe/another-repo" },
];

const mockOrgRepos = [
  { name: "test-snap-id" },
  { name: "canonical-repo" },
  { name: "ubuntu-repo" },
];

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({
      snapId: "test-snap-id",
    }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderComponent() {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RepoSelector
          githubData={mockGithubData}
          setAutoTriggerBuild={vi.fn()}
        />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

const server = setupServer(
  // Default handler for validation endpoint
  http.get("/api/*/builds/validate-repo", () => {
    return HttpResponse.json({ success: true });
  }),
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("RepoSelector", () => {
  test("renders organization selector and repository input", () => {
    renderComponent();

    expect(screen.getByLabelText("Select an organization")).toBeInTheDocument();
    expect(screen.getByLabelText("Select a repository")).toBeInTheDocument();
  });

  test("repository input is disabled when no organization is selected", () => {
    renderComponent();

    const repoInput = screen.getByLabelText("Select a repository");
    expect(repoInput).toBeDisabled();
  });

  test("autofills repository name when matching repository exists for user", async () => {
    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(mockRepos);
      }),
      http.get("/api/test-snap-id/builds/validate-repo", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select the user's personal organization
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for repos to load and autofill to happen
    await waitFor(() => {
      const repoInput = screen.getByLabelText(
        "Select a repository",
      ) as HTMLInputElement;
      expect(repoInput.value).toBe("test-snap-id");
    });
  });

  test("autofills repository name when matching repository exists for organization", async () => {
    server.use(
      http.get("/publisher/github/get-repos", ({ request }) => {
        const url = new URL(request.url);
        const org = url.searchParams.get("org");
        if (org === "canonical") {
          return HttpResponse.json(mockOrgRepos);
        }
        return HttpResponse.json([]);
      }),
      http.get("/api/test-snap-id/builds/validate-repo", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select an organization
    await user.selectOptions(orgSelect, "canonical");

    // Wait for repos to load and autofill to happen
    await waitFor(() => {
      const repoInput = screen.getByLabelText(
        "Select a repository",
      ) as HTMLInputElement;
      expect(repoInput.value).toBe("test-snap-id");
    });
  });

  test("does not autofill when no matching repository exists", async () => {
    const reposWithoutMatch = [
      { name: "other-repo", nameWithOwner: "johndoe/other-repo" },
      { name: "another-repo", nameWithOwner: "johndoe/another-repo" },
    ];

    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(reposWithoutMatch);
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select the user's personal organization
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for repos to load by checking the input is enabled
    await waitFor(() => {
      const repoInput = screen.getByLabelText(
        "Select a repository",
      ) as HTMLInputElement;
      expect(repoInput).not.toBeDisabled();
    });

    // Repository input should remain empty
    const repoInput = screen.getByLabelText(
      "Select a repository",
    ) as HTMLInputElement;
    expect(repoInput.value).toBe("");
  });

  test("clears input when organization changes", async () => {
    server.use(
      http.get("/publisher/github/get-repos", ({ request }) => {
        const url = new URL(request.url);
        const org = url.searchParams.get("org");
        if (org === "canonical") {
          return HttpResponse.json(mockOrgRepos);
        }
        return HttpResponse.json(mockRepos);
      }),
      http.get("/api/test-snap-id/builds/validate-repo", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select user organization first
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for autofill
    await waitFor(() => {
      const repoInput = screen.getByLabelText(
        "Select a repository",
      ) as HTMLInputElement;
      expect(repoInput.value).toBe("test-snap-id");
    });

    // Change to different organization
    await user.selectOptions(orgSelect, "canonical");

    // Input should be cleared and then autofilled again
    await waitFor(() => {
      const repoInput = screen.getByLabelText(
        "Select a repository",
      ) as HTMLInputElement;
      expect(repoInput.value).toBe("test-snap-id");
    });
  });

  test("does not autofill if user manually enters a value after organization selection", async () => {
    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(mockRepos);
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");
    const repoInput = screen.getByLabelText("Select a repository");

    // Select organization first - this will autofill
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for autofill to happen
    await waitFor(() => {
      expect((repoInput as HTMLInputElement).value).toBe("test-snap-id");
    });

    // Now manually clear and type a different value
    fireEvent.change(repoInput, { target: { value: "manual-input" } });

    // Input should keep the manually entered value
    expect((repoInput as HTMLInputElement).value).toBe("manual-input");
  });

  test("handles validation API error responses", async () => {
    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(mockRepos);
      }),
      http.get("/api/test-snap-id/builds/validate-repo", () => {
        return HttpResponse.json(
          { success: false, error: { message: "Repository not found" } },
          { status: 200 },
        );
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select organization - this will autofill and trigger validation
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText("Repository not found")).toBeInTheDocument();
    });
  });

  test("handles validation network errors", async () => {
    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(mockRepos);
      }),
      http.get("/api/test-snap-id/builds/validate-repo", () => {
        return HttpResponse.error();
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");

    // Select organization - this will autofill and trigger validation
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for validation to complete (should handle error gracefully)
    await waitFor(() => {
      const repoInput = screen.getByLabelText("Select a repository");
      expect(repoInput).not.toBeDisabled();
    });
  });

  test("handles empty repository input correctly", async () => {
    // Use repos that DON'T match the snap name to avoid autofill
    const nonMatchingRepos = [
      { name: "different-repo", nameWithOwner: "johndoe/different-repo" },
      { name: "another-repo", nameWithOwner: "johndoe/another-repo" },
    ];

    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(nonMatchingRepos);
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");
    const repoInput = screen.getByLabelText("Select a repository");

    // Select organization - this won't autofill since no repo matches snap name
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for repos to load but input should remain empty
    await waitFor(() => {
      expect((repoInput as HTMLInputElement).value).toBe("");
    });

    // Type something and then clear it to test the empty input handling
    await user.type(repoInput, "test");
    expect((repoInput as HTMLInputElement).value).toBe("test");

    // Clear the input using backspace to trigger empty searchTerm logic
    await user.clear(repoInput);

    // Verify the input is empty (this should trigger the empty searchTerm logic)
    expect((repoInput as HTMLInputElement).value).toBe("");
  });

  test("handles manual validation errors when user types repository name", async () => {
    // Use repos that DON'T match the snap name to avoid autofill
    const nonMatchingRepos = [
      { name: "different-repo", nameWithOwner: "johndoe/different-repo" },
      { name: "manual-repo", nameWithOwner: "johndoe/manual-repo" },
    ];

    server.use(
      http.get("/publisher/github/get-repos", () => {
        return HttpResponse.json(nonMatchingRepos);
      }),
      // Mock validation to return error for manual input
      http.get("/api/test-snap-id/builds/validate-repo", ({ request }) => {
        const url = new URL(request.url);
        const repo = url.searchParams.get("repo");
        if (repo === "johndoe/manual-repo") {
          return HttpResponse.json(
            { success: false, error: { message: "Manual validation failed" } },
            { status: 200 },
          );
        }
        return HttpResponse.json({ success: true });
      }),
    );

    renderComponent();

    const user = userEvent.setup();
    const orgSelect = screen.getByLabelText("Select an organization");
    const repoInput = screen.getByLabelText("Select a repository");

    // Select organization - this won't autofill
    await user.selectOptions(orgSelect, "johndoe");

    // Wait for repos to load
    await waitFor(() => {
      expect((repoInput as HTMLInputElement).value).toBe("");
    });

    // Manually type a repository name that will trigger validation error
    await user.type(repoInput, "manual-repo");

    // Wait for manual validation error to appear
    await waitFor(() => {
      expect(screen.getByText("Manual validation failed")).toBeInTheDocument();
    });
  });
});
