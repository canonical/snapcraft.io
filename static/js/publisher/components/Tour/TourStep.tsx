import { Card, Button, Icon } from "@canonical/react-ds-global";

import type { TooltipRenderProps } from "react-joyride";

function TourStep(props: TooltipRenderProps): React.JSX.Element {
  const {
    backProps,
    closeProps,
    continuous,
    index,
    primaryProps,
    step,
    isLastStep,
    size,
  } = props;

  return (
    <Card style={{ border: "none" }}>
      <Card.Content>
        <h4>{step.title}</h4>
        {step.content}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            Done?{" "}
            <Button
              variant="link"
              className="u-no-margin--bottom"
              {...closeProps}
            >
              Skip tour
            </Button>
            .
          </div>
          <div>
            <span>
              {index + 1} / {size}
            </span>

            <Button
              {...backProps}
              disabled={index < 1}
              className="u-no-margin--bottom"
              style={{ marginLeft: "1rem" }}
              importance="secondary"
            >
              <Icon icon="chevron-left" />
              <span className="u-off-screen">{backProps.title}</span>
            </Button>

            {continuous && (
              <>
                <Button
                  importance="primary"
                  anticipation="constructive"
                  {...primaryProps}
                  className="u-no-margin--bottom u-no-margin--right"
                >
                  {isLastStep ? (
                    <>Finish tour</>
                  ) : (
                    <>
                      <Icon icon="chevron-right" />
                      <span className="u-off-screen">{primaryProps.title}</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

export default TourStep;
