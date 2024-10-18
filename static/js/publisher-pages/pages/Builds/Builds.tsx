import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useRecoilState } from "recoil";
import { Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import LoggedOut from "./LoggedOut";
import RepoNotConnected from "./RepoNotConnected";
import RepoConnected from "./RepoConnected";

import { githubDataState } from "../../state/atoms";

import type { GithubData } from "../../types";

function Builds(): JSX.Element {
  const { snapId } = useParams();
  const [githubData, setGithubData] = useRecoilState(githubDataState);
  const { isLoading } = useQuery({
    queryKey: ["githubData"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/repo`);

      if (!response.ok) {
        setGithubData(null);
      }

      const responseData = await response.json();

      setGithubData(responseData.data);
      return responseData.data;
    },
    retry: 0,
  });

  const isLoggedIn = (data: GithubData | null) => {
    if (!data) {
      return false;
    }

    return data.github_user !== null;
  };

  const repoConnected = (data: GithubData | null) => {
    if (!data) {
      return false;
    }

    return data.github_repository !== null;
  };

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Builds
      </h1>

      <SectionNav snapName={snapId} activeTab="builds" />

      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} builds data
          </p>
        </Strip>
      )}

      {!isLoading && !isLoggedIn(githubData) && <LoggedOut />}

      {!isLoading && isLoggedIn(githubData) && !repoConnected(githubData) && (
        <RepoNotConnected />
      )}
      {githubData && isLoggedIn(githubData) && repoConnected(githubData) && (
        <RepoConnected />
      )}
    </>
  );
}

export default Builds;
