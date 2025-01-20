import checkSigningKeyExists from "../checkSigningKeyExists";

const signingKeys = [
  {
    "brand-account-id": "oiusd98797sdf",
    "created-at": "2023-06-21T14:10:07.108051",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "SDKJ987DKJLLK897SDSG",
    "modified-at": null,
    "modified-by": null,
    name: "test-key-1",
    "sha3-384":
      "-h3_wh8IBTzfSq4R6SOWPJffTl8AWu7Auv-uEhxGX95Rwt613IPLPnVyDamY423_",
  },
  {
    "brand-account-id": "oiusd98797sdf",
    "created-at": "2023-06-22T12:45:28.301419",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "SJDFKSJ837KSHD8HS",
    "modified-at": null,
    "modified-by": null,
    name: "test-key-2",
    "sha3-384":
      "xkHp78Yv8rg3phl6bjnCiHiZnbYgmJ-h9fTxFHOjncABZo1-DQZjcJQPmn4wk1ZL",
  },
];

describe("checkSigningKeyExists", () => {
  it("returns true if the new key name matches any existing keys", () => {
    expect(checkSigningKeyExists("test-key-1", signingKeys)).toBe(true);
  });

  it("returns false if the new key name doesn't match any existing keys", () => {
    expect(checkSigningKeyExists("test-key-3", signingKeys)).toBe(false);
  });
});
