import { useState, SyntheticEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Row,
  Col,
  CheckboxInput,
  Notification,
} from "@canonical/react-components";

type Props = {
  trending: boolean;
};

function PubliciseBadges({ trending }: Props): React.JSX.Element {
  const { snapId } = useParams();
  const [showStableChannelBadge, setShowStableChannelBadge] =
    useState<boolean>(true);
  const [showTrendingStatusBadge, setShowTrendingStatusBadge] =
    useState<boolean>(false);

  const showPreview: boolean =
    showStableChannelBadge || showTrendingStatusBadge;

  const htmlSnippetStable = `<a href="https://snapcraft.io/${snapId}">
  <img alt="${snapId}" src="https://snapcraft.io/${snapId}/badge.svg" />
</a>`;

  const htmlSnippetTrending = `<a href="https://snapcraft.io/${snapId}">
  <img alt="${snapId}" src="https://snapcraft.io/${snapId}/trending.svg?name=0" />
</a>`;

  const markdownSnippetStable = `[![${snapId}](https://snapcraft.io/${snapId}/badge.svg)](https://snapcraft.io/${snapId})`;

  const markdownSnippetTrending = `[![${snapId}](https://snapcraft.io/${snapId}/trending.svg?name=0)](https://snapcraft.io/${snapId})`;

  return (
    <>
      <Row>
        <Col size={2}>
          <p>Display:</p>
        </Col>
        <Col size={10}>
          <CheckboxInput
            label="Stable channel from default track"
            checked={showStableChannelBadge}
            onChange={(
              e: SyntheticEvent<HTMLInputElement> & {
                target: HTMLInputElement;
              },
            ) => {
              setShowStableChannelBadge(e.target.checked);
            }}
          />
          <CheckboxInput
            label="Trending status"
            labelClassName="u-no-margin--bottom"
            checked={showTrendingStatusBadge}
            onChange={(
              e: SyntheticEvent<HTMLInputElement> & {
                target: HTMLInputElement;
              },
            ) => {
              setShowTrendingStatusBadge(e.target.checked);
            }}
          />
          <p style={{ paddingLeft: "2rem" }}>
            <small className="u-text-muted">
              Badge will only display when your snap is flagged as trending
            </small>
          </p>
          {!showStableChannelBadge && !showTrendingStatusBadge && (
            <p>
              <em>
                Please select at least one badge to display from the list above
              </em>
            </p>
          )}
        </Col>
      </Row>
      {showPreview && (
        <>
          <Row>
            <Col size={2}>
              <p>Preview:</p>
            </Col>
            <Col size={10}>
              <p>
                {showStableChannelBadge && (
                  <a href={`/${snapId}`}>
                    <img src={`/${snapId}/badge.svg`} alt={snapId} />
                  </a>
                )}{" "}
                {showTrendingStatusBadge && (
                  <a href={`/${snapId}`}>
                    <img
                      src={`/${snapId}/trending.svg?name=0&preview=1`}
                      alt={snapId}
                    />
                  </a>
                )}
              </p>

              {!trending && showTrendingStatusBadge && (
                <Notification severity="information" title="Trending badge">
                  Your snap is not currently flagged as trending. Only when your
                  snap becomes trending will the trending badge appear on
                  external sites.
                </Notification>
              )}
            </Col>
          </Row>
          <Row>
            <Col size={2}>
              <p>HTML:</p>
            </Col>
            <Col size={10}>
              <div className="p-code-snippet">
                <pre className="p-code-snippet__block">
                  {showStableChannelBadge && htmlSnippetStable}
                  <br />
                  {showTrendingStatusBadge && htmlSnippetTrending}
                </pre>
              </div>
            </Col>
          </Row>
          <Row>
            <Col size={2}>
              <p>Markdown:</p>
            </Col>
            <Col size={10}>
              <div className="p-code-snippet">
                <pre className="p-code-snippet__block is-wrapped">
                  {showStableChannelBadge && markdownSnippetStable}
                  <br />
                  {showTrendingStatusBadge && markdownSnippetTrending}
                </pre>
              </div>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}

export default PubliciseBadges;
