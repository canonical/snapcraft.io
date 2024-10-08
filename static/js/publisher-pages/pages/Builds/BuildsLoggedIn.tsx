import { Strip } from "@canonical/react-components";

type Props = {
  githubUser: {
    avatarUrl: string;
    login: string;
    name: string;
  };
};

function BuildsLoggedIn({ githubUser }: Props): JSX.Element {
  return (
    <>
      <div className="snapcraft-p-sticky js-sticky-bar">
        <div className="u-fixed-width">
          <ul className="p-inline-list u-no-margin--bottom">
            <li className="p-inline-list__item u-no-margin--right">
              Your GitHub account is connected.
            </li>
            <li className="p-inline-list__item">
              <a
                href={`https://github.com/${githubUser.login}`}
                className="p-link--soft u-float-right"
              >
                <img
                  src={githubUser.avatarUrl}
                  alt={`@${githubUser.login}`}
                  className="p-build__avatar"
                />{" "}
                {githubUser.name}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
      <Strip shallow>
        <p>
          Your repo needs a snapcraft.yaml file, so that Snapcraft can make it
          buildable, installable, and runnable.
        </p>
      </Strip>
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
      <Strip shallow>
        <div className="u-fixed-width">
          <h4>If you can't find a repository …</h4>
          <p>
            Want to <strong>use a private repo</strong>? We're working hard on
            making these buildable.
          </p>
          <p>
            <strong>Don't have admin permission</strong>? Ask a repo admin to
            add it instead, and it will show up in your repo list too.
          </p>
          <p>
            <strong>Missing an organization</strong>?
          </p>
          <a
            className="p-button"
            href="https://github.com/settings/applications"
          >
            Review organization access
          </a>
        </div>
      </Strip>
    </>
  );
}

export default BuildsLoggedIn;
