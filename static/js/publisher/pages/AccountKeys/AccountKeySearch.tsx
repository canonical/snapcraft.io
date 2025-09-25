import { Button, Icon } from "@canonical/react-components";

function AccountKeysSearch(): React.JSX.Element {
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
        value={""}
        onChange={(e) => {
          if (e.target.value) {
            // TODO
          } else {
          }
        }}
      />
      <Button
        type="reset"
        className="p-search-box__reset"
        onClick={() => {
          // TODO
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
