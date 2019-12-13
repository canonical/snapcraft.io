import React, { Fragment } from "react";
import PropTypes from "prop-types";

import progressiveTypes from "./types";
import ProgressiveRow from "./progressiveRow";
import GlobalRow from "./globalRow";

const ProgressiveRowGroup = ({
  releases,
  useGlobal,
  globalPercentage,
  toggleGlobal,
  updatePercentage
}) => {
  return (
    <Fragment>
      {Object.keys(releases).map((releaseKey, index) => {
        if (index === 1) {
          return (
            <Fragment key="global">
              <GlobalRow
                useGlobal={useGlobal}
                toggleGlobal={toggleGlobal}
                globalPercentage={globalPercentage}
              />
              <ProgressiveRow
                release={releases[releaseKey]}
                type={progressiveTypes.RELEASE}
                globalPercentage={useGlobal ? globalPercentage : null}
                key={releaseKey}
              />
            </Fragment>
          );
        }
        return (
          <ProgressiveRow
            release={releases[releaseKey]}
            type={progressiveTypes.RELEASE}
            globalPercentage={useGlobal ? globalPercentage : null}
            key={releaseKey}
            updateGlobalPercentage={
              useGlobal && index === 0 ? updatePercentage : null
            }
          />
        );
      })}
    </Fragment>
  );
};

ProgressiveRowGroup.propTypes = {
  releases: PropTypes.object,
  useGlobal: PropTypes.bool,
  globalPercentage: PropTypes.number,
  toggleGlobal: PropTypes.func,
  updatePercentage: PropTypes.func
};

export default ProgressiveRowGroup;
