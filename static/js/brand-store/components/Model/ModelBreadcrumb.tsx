import { Link, useParams } from "react-router-dom";

interface RouteParams {
  id?: string;
  model_id?: string;
}
function ModelBreadcrumb(): JSX.Element {
  const { id, model_id } = useParams() as RouteParams;

  return (
    <h1 className="p-heading--4">
      <Link to={`/admin/${id ?? ""}/models`}>&lsaquo;&nbsp;Models</Link> /{" "}
      {model_id ?? ""}
    </h1>
  );
}

export default ModelBreadcrumb;
