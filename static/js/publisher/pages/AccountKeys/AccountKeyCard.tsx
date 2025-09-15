import { Button, Card, Icon } from "@canonical/react-components";
import { AccountKeyData } from "../../types/accountKeysTypes";

function AccountKeyCard(props: {
  accountKey: AccountKeyData;
}): React.JSX.Element {
  const {
    accountKey: {
      name,
      "public-key-sha3-384": sha384,
      since: _since,
      until: _until,
      constraints,
    },
  } = props;

  const since = new Date(_since);
  const hasUntil = !!_until; // valid keys don't have an "until" value by default
  const until = hasUntil ? new Date(_until) : new Date("9999-12-31");
  const isExpired = until < new Date();

  const sinceDateText = `Added on ${since.toLocaleDateString()}`;
  const untilDateText = hasUntil
    ? isExpired
      ? `, expired on ${until.toLocaleDateString()}`
      : `, will expire on ${until.toLocaleDateString()}`
    : "";

  return (
    <Card className="p-account-keys-card">
      <h3 className="u-has-icon">
        {isExpired ? <Icon name="error" /> : <Icon name="success" />}
        {name}
      </h3>

      {constraints && (
        <Button className="p-account-key-card__constraints-btn">
          Constraints <Icon name="chevron-right" />
        </Button>
      )}

      <div className="p-text--small-caps">
        Fingerprint:
      </div>
      <div>
        <pre className="p-account-key-card__sha384 u-truncate">{sha384}</pre>
      </div>

      <div className="u-text-max-width">
        <p className="p-text--small">{sinceDateText + untilDateText}</p>
      </div>
    </Card>
  );
}

export default AccountKeyCard;
