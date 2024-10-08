import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import BuildsDefault from "./BuildsDefault";
import BuildsLoggedIn from "./BuildsLoggedIn";
import BuildsConnected from "./BuildsConnected";

type GithubData = {
  github_orgs: { name: string }[];
  github_repository: string | null;
  github_user: {
    avatarUrl: string;
    login: string;
    name: string;
  } | null;
};

function Builds(): JSX.Element {
  const { snapId } = useParams();
  const {
    data: githubData,
    isLoading: githubDataIsLoading,
    isFetched: githubDataIsFetched,
  } = useQuery({
    queryKey: ["githubData"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/repo`);

      if (!response.ok) {
        return {
          github_orgs: [],
          github_repository: null,
          github_user: null,
        };
      }

      const data = await response.json();

      return data.data;
    },
  });

  const isLoggedIn = (data: GithubData): boolean => data.github_user !== null;
  const isConnected = (data: GithubData): boolean =>
    data.github_repository !== null;

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Builds
      </h1>

      <SectionNav snapName={snapId} activeTab="builds" />

      {githubDataIsLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} builds data
          </p>
        </Strip>
      )}

      {githubDataIsFetched && !isLoggedIn(githubData) && <BuildsDefault />}

      {githubDataIsFetched &&
        isLoggedIn(githubData) &&
        !isConnected(githubData) && (
          <BuildsLoggedIn githubUser={githubData.github_user} />
        )}

      {githubDataIsFetched &&
        isLoggedIn(githubData) &&
        isConnected(githubData) && (
          <BuildsConnected githubRepo={githubData.github_repository} />
        )}
    </>
  );
}

export default Builds;
