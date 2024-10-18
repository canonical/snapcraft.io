import { useParams } from "react-router-dom";

import SectionNav from "../../components/SectionNav";
import LoggedOut from "./LoggedOut";

function Builds(): JSX.Element {
  const { snapId } = useParams();

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Builds
      </h1>

      <SectionNav snapName={snapId} activeTab="builds" />

      <LoggedOut />
    </>
  );
}

export default Builds;
