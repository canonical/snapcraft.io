import { Icon } from "@canonical/react-components";

function AccountKeysLoading(): React.JSX.Element {
  return (
    <div className="u-fixed-width">
      <Icon name="spinner" className="u-animation--spin" />
      &nbsp;Loading...
    </div>
  );
}

export default AccountKeysLoading;
