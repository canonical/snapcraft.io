function formatBuildStatus(status: string): React.JSX.Element {
  switch (status) {
    case "never_built":
      return <>Never built </>;
    case "building_soon":
      return <>Building soon </>;
    case "wont_release":
      return <>Won't release</>;
    case "released":
      return <>Released </>;
    case "release_failed":
      return <>Release failed </>;
    case "releasing_soon":
      return <>Releasing soon </>;
    case "in_progress":
      return (
        <>
          <i className="p-icon--spinner u-animation--spin" />
          In progress
        </>
      );
    case "failed_to_build":
      return <>Failed to build </>;
    case "cancelled":
      return <>Cancelled </>;
    case "unknown":
      return <>Unknown </>;
    case "ERROR":
      return <>Error </>;
    case "SUCCESS":
      return <>Success </>;
    case "IDLE":
      return <>Idle </>;
    default:
      return <>{status} </>;
  }
};

export default formatBuildStatus;
