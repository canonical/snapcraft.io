import { Link, matchRoutes, useLocation } from "react-router-dom";
import { Fragment } from "react/jsx-runtime";
import routes from "./routes";

function Breadcrumbs(): React.JSX.Element {
  const { pathname } = useLocation();

  const match = matchRoutes(routes, pathname) ?? [];
  const segments = match
    .filter(({ route }) => route.label)
    .map(({ params, pathname, route }) => {
      let label = route.label ?? "";

      Object.entries(params).forEach(([key, value]) => {
        label = label.replaceAll(`:${key}`, value ?? "");
      });

      return { label, to: pathname };
    });

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <Link to="/snaps">My snaps</Link>&nbsp;/&nbsp;
        {segments?.map(({ label, to }, i) => (
          <Fragment key={i}>
            {i + 1 < segments?.length ? (
              <>
                <Link to={to}>{label}</Link>&nbsp;/&nbsp;
              </>
            ) : (
              label
            )}
          </Fragment>
        ))}
      </h1>

      {/* TODO: this is the proper accessible implementation of the breadcrumbs pattern,
          we should change the layout to use this rather than the h1 above */}
      {/* <nav className="p-breadcrumbs" aria-label="Breadcrumb" aria-live="polite">
        <ol className="p-breadcrumbs__items">
          <li className="p-breadcrumbs__item">
            <Link to="/snaps">My snaps</Link>
          </li>
          {segments?.map(({ label, to }, i) => (
            <li className="p-breadcrumbs__item" key={i}>
              {i + 1 < segments?.length ? (
                <Link to={to}>{label}</Link>
              ) : (
                <span aria-current="page">{label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav> */}
    </>
  );
}

export default Breadcrumbs;
