import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useRecoilState, useSetRecoilState } from "recoil";
import { Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import LoggedOut from "./LoggedOut";
import RepoNotConnected from "./RepoNotConnected";
import RepoConnected from "./RepoConnected";

import {
  buildLoggedInState,
  buildRepoConnectedState,
  githubDataState,
} from "../../state/atoms";

function Builds(): JSX.Element {
  const { snapId } = useParams();
  const [loggedIn, setLoggedOut] = useRecoilState(buildLoggedInState);
  const [repoConnected, setRepoConnected] = useRecoilState(
    buildRepoConnectedState,
  );
  const setGithubData = useSetRecoilState(githubDataState);

  const { isLoading, isFetched } = useQuery({
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

      if (data.github_user !== null) {
        setLoggedOut(true);
      }

      if (data.github_repository !== null) {
        setRepoConnected(true);
      }

      setGithubData(data.data);
    },
  });

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

      {isFetched && !loggedIn && <LoggedOut />}
      {isFetched && loggedIn && !repoConnected && <RepoNotConnected />}
      {isFetched && loggedIn && repoConnected && <RepoConnected />}
    </>
  );
}

export default Builds;
