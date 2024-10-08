import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useRecoilState, useSetRecoilState } from "recoil";
import { Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import BuildsDefault from "./BuildsDefault";
import BuildsLoggedIn from "./BuildsLoggedIn";
import BuildsConnected from "./BuildsConnected";

import {
  buildLoggedInState,
  buildRepoConnectedState,
  githubDataState,
} from "../../state/atoms";

function Builds(): JSX.Element {
  const { snapId } = useParams();
  const [loggedIn, setLoggedIn] = useRecoilState(buildLoggedInState);
  const [repoConnected, setRepoConnected] = useRecoilState(
    buildRepoConnectedState,
  );
  const setGithubData = useSetRecoilState(githubDataState);

  const { data, isLoading, isFetched } = useQuery({
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

  if (isFetched && data) {
    if (data.github_user !== null) {
      setLoggedIn(true);
    }

    if (data.github_repository !== null) {
      setRepoConnected(true);
    }

    setGithubData(data);
  }

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

      {isFetched && !loggedIn && <BuildsDefault />}
      {isFetched && loggedIn && !repoConnected && <BuildsLoggedIn />}
      {isFetched && loggedIn && repoConnected && <BuildsConnected />}
    </>
  );
}

export default Builds;
