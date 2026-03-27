import { Link, useParams } from "react-router-dom";

interface RouteParams {
  id?: string;
  modelId?: string;
}
function ModelBreadcrumb(): React.JSX.Element {
  const { id, modelId } = useParams() as RouteParams;

  return (
    <h1 className="p-heading--4">
      <Link to={`/admin/${id ?? ""}/models`}>&lsaquo;&nbsp;Models</Link> /{" "}
      {modelId ?? ""}
    </h1>
  );
}

export default ModelBreadcrumb;
