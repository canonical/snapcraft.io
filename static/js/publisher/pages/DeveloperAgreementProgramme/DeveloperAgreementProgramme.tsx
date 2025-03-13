import { useState, ReactNode } from "react";

import { setPageTitle } from "../../utils";

function DeveloperAgreementProgramme(): ReactNode {
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);

  setPageTitle(
    "Developer Program Agreement — Linux software in the Snap Store",
  );

  return (
    <section className="p-strip">
      <div className="row">
        <h1 className="p-heading--2">Developer Programme Agreement</h1>
      </div>

      <div className="row">
        <div className="p-card">
          <h2 className="p-heading--4">
            Snap Store Terms of Service and Privacy Notice
          </h2>
          <p className="p-card__content">
            <a
              href="https://ubuntu.com/legal/terms-and-policies/snap-store-terms"
              target="_blank"
              rel="noreferrer"
            >
              Snap Store Terms of Service
            </a>
          </p>
          <p className="p-card__content">
            <a
              href="https://www.ubuntu.com/legal/data-privacy/snap-store"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Notice
            </a>
          </p>
        </div>
      </div>

      <div className="row u-no-margin--top">
        <form method="POST" action="/account/agreement">
          <input type="hidden" name="csrf_token" value={window.CSRF_TOKEN} />
          <div className="row">
            <div className="col-8">
              <div className="p-form-validation">
                <input
                  name="i_agree"
                  id="id_i_agree"
                  className="p-form-validation__input"
                  type="checkbox"
                  onChange={(e) => {
                    setAgreementAccepted(e.target.checked);
                  }}
                  value={agreementAccepted ? "on" : "off"}
                />
                <label htmlFor="id_i_agree">
                  I agree to the terms and privacy notice
                </label>
              </div>
            </div>
            <div className="col-4 u-align--right">
              <a className="p-button" href="/">
                Cancel
              </a>
              <button
                className="p-button--positive"
                disabled={!agreementAccepted}
                type="submit"
              >
                Continue
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default DeveloperAgreementProgramme;
