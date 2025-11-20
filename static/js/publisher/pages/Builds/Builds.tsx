import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useAtom } from "jotai";

import LoggedOut from "./LoggedOut";
import RepoNotConnected from "./RepoNotConnected";
import RepoConnected from "./RepoConnected";

import {
  buildLoggedInState,
  buildRepoConnectedState,
  githubDataState,
} from "../../state/buildsState";

import { setPageTitle } from "../../utils";
import Loader from "../../components/Loader";

function Builds(): React.JSX.Element {
  const { snapId } = useParams();
  const [githubData, setGithubData] = useAtom(githubDataState);
  const [loggedIn, setLoggedIn] = useAtom(buildLoggedInState);
  const [repoConnected, setRepoConnected] = useAtom(buildRepoConnectedState);
  const [autoTriggerBuild, setAutoTriggerBuild] = useState<boolean>(false);
  const { isLoading } = useQuery({
    queryKey: ["githubData", snapId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/repo`);

      if (!response.ok) {
        setGithubData(null);
      }

      const responseData = await response.json();

      const githubData = responseData.data;

      setLoggedIn(githubData && githubData.github_user !== null);
      setRepoConnected(githubData && githubData.github_repository !== null);
      setGithubData(responseData.data);

      return responseData.data;
    },
    retry: 0,
  });

  setPageTitle(`Builds for ${snapId}`);

  return (
    <>
      {isLoading && <Loader text={`Loading ${snapId} builds data`} />}

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
