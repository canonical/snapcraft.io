import { Button, Icon } from "@canonical/react-components";

function AccountKeysSearch(props: {
  value?: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div className="p-search-box">
      <label className="u-off-screen" htmlFor="search">
        Search account keys
      </label>
      <input
        required
        type="search"
        id="search"
        name="search"
        className="p-search-box__input"
        placeholder="Search account keys"
        autoComplete="off"
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      />
      <Button
        type="reset"
        className="p-search-box__reset"
        onClick={() => {
          props.onChange("");
        }}
      >
        <Icon name="close">Clear filter</Icon>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <Icon name="search">Search</Icon>
      </Button>
    </div>
  );
}

export default AccountKeysSearch;
