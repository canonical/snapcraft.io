import { Spinner, Strip } from "@canonical/react-components";

function Loader({ text: text }: { text?: string }): React.JSX.Element {
  return (
    <Strip shallow>
      <Spinner text={text ?? "Loading..."} />
    </Strip>
  );
}

export default Loader;
