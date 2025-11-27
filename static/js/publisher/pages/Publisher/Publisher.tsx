import { Link } from "react-router-dom";

function Publisher(): React.JSX.Element {
  return (
    <div className="u-fixed-width">
      <h1>Publisher</h1>
      <p>
        As a publisher you can{" "}
        <Link to="/snaps">register a snap name on the Snap store</Link> and{" "}
        <a href={`${window.API_URL}stores/snaps/`}>
          manage your snaps on the dashboard
        </a>
        .
      </p>
    </div>
  );
}

export default Publisher;
