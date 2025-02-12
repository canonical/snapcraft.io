import { TooltipRenderProps } from "react-joyride";
import { Card, Button, Icon } from "@canonical/react-components";

function TourStep(props: TooltipRenderProps) {
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
      <h4>{step.title}</h4>
      {step.content}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          Done?{" "}
          <button
            className="p-button--link u-no-margin--bottom"
            {...closeProps}
          >
            Skip tour
          </button>
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
          >
            <Icon name="chevron-left" />
            <span className="u-off-screen">{backProps.title}</span>
          </Button>

          {continuous && (
            <>
              <Button
                appearance="positive"
                {...primaryProps}
                className="u-no-margin--bottom u-no-margin--right"
              >
                {isLastStep ? (
                  <>Finish tour</>
                ) : (
                  <>
                    <Icon name="chevron-right" light />
                    <span className="u-off-screen">{primaryProps.title}</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default TourStep;
