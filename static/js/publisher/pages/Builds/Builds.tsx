import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useAtom } from "jotai";
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

import { setPageTitle } from "../../utils";

function Builds(): React.JSX.Element {
  const { snapId } = useParams();
  const [githubData, setGithubData] = useAtom(githubDataState);
  const [loggedIn, setLoggedIn] = useAtom(buildLoggedInState);
  const [repoConnected, setRepoConnected] = useAtom(buildRepoConnectedState);
  const [autoTriggerBuild, setAutoTriggerBuild] = useState<boolean>(false);
  const { isLoading } = useQuery({
    queryKey: ["githubData"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/repo`);

      if (!response.ok) {
        setGithubData(null);
      }

      const responseData = await response.json();

      const githubData = responseData.data;

      setLoggedIn(githubData.github_user !== null);
      setRepoConnected(githubData.github_repository !== null);
      setGithubData(responseData.data);

      return responseData.data;
    },
    retry: 0,
  });

  setPageTitle(`Builds for ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
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

      {!isLoading && !loggedIn && <LoggedOut />}
      {!isLoading && loggedIn && !repoConnected && (
        <RepoNotConnected setAutoTriggerBuild={setAutoTriggerBuild} />
      )}
      {githubData && loggedIn && repoConnected && (
        <RepoConnected
          autoTriggerBuild={autoTriggerBuild}
          setAutoTriggerBuild={setAutoTriggerBuild}
        />
      )}
    </>
  );
}

export default Builds;
