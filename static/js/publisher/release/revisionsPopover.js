import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class RevisionsPopover extends Component {
  constructor() {
    super();
    this.closePopover = this.closePopover.bind(this);
  }

  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener("click", this.closePopover);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.closePopover);
  }

  closePopover(event) {
    // ignore clicks from within of popover
    if (!event.target.closest(".p-revisions-popover")) {
      this.props.closeRevisionsPopover();
    }
  }

  render() {
    const {
      top,
      left,
      filters,
      revisions,
      releasedChannels,
      selectedRevisions,
      selectRevision
    } = this.props;

    const style = { top, left };

    let filteredRevisions = revisions;
    let title = "Latest revisions";

    if (filters.arch) {
      filteredRevisions = filteredRevisions.filter(revision => {
        return revision.architectures.includes(filters.arch);
      });

      title = `${title} in ${filters.arch}`;
    }

    return (
      <div className="p-revisions-popover" style={style}>
        <RevisionsList
          title={title}
          idPrefix="popover"
          revisions={filteredRevisions}
          releasedChannels={releasedChannels}
          selectedRevisions={selectedRevisions}
          selectRevision={selectRevision}
        />
      </div>
    );
  }
}

RevisionsPopover.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  filters: PropTypes.object,
  closeRevisionsPopover: PropTypes.func.isRequired,
  revisions: PropTypes.array.isRequired,
  selectedRevisions: PropTypes.array.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  selectRevision: PropTypes.func.isRequired
};
