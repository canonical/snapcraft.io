import { useState } from "react";
import { nanoid } from "nanoid";
import { Row, Col, Button } from "@canonical/react-components";

type Props = {
  register: Function;
  getFieldState: Function;
};

function ListingDescriptionField({ register, getFieldState }: Props) {
  const id = nanoid();
  const fieldState = getFieldState ? getFieldState("description") : "";
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);

  return (
    <Row
      className={`p-form__group ${
        fieldState.invalid && "p-form-validation is-error"
      }`}
    >
      <Col size={2} data-tour="listing-description">
        <label htmlFor={id} className="p-form__label">
          Description:
        </label>
      </Col>
      <Col size={8}>
        <div className="p-form__control">
          <textarea
            data-tour="listing-description"
            id={id}
            className="p-form-validation__input"
            rows={10}
            {...register("description", { required: true })}
          />
        </div>
        <p className="p-form-help-text u-no-margin--bottom">
          <Button
            type="button"
            appearance="link"
            small={true}
            className="u-no-padding--left u-no-padding--right"
            onClick={() => {
              setShowMarkdownGuide(!showMarkdownGuide);
            }}
          >
            Show supported markdown syntax
          </Button>
        </p>
        {showMarkdownGuide && (
          <Row>
            <Col size={4}>
              <p>
                <small>
                  <strong>Bold</strong>: <code>**Foo**</code>
                </small>
              </p>
              <p>
                <small>
                  <strong>URLs</strong>: <code>https://foo.bar</code>
                </small>
              </p>
              <p>
                <small>
                  <strong>Lists</strong>: <code>* Foo</code>
                </small>
              </p>
            </Col>
            <Col size={4}>
              <p>
                <small>
                  <strong>Italics</strong>: <code>_Foo_</code>
                </small>
              </p>
              <p>
                <small>
                  <strong>Code</strong>: Text indented with 3 spaces of inside{" "}
                  <code>`</code>
                </small>
              </p>
            </Col>
          </Row>
        )}
      </Col>
    </Row>
  );
}

export default ListingDescriptionField;
