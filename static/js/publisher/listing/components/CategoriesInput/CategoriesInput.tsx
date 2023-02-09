import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { Row, Col, Button, Icon } from "@canonical/react-components";

type Props = {
  register: Function;
  getFieldState: Function;
  primaryCategory: string;
  secondaryCategory: string;
  setValue: Function;
  categories: Array<{
    slug: string;
    name: string;
  }>;
};

function CategoriesInput({
  categories,
  register,
  getFieldState,
  setValue,
  primaryCategory,
  secondaryCategory,
}: Props) {
  const primaryCategoryFieldId = nanoid();
  const primaryCategoryFieldState = getFieldState
    ? getFieldState("primary-category")
    : "";

  const secondaryCategoryFieldId = nanoid();
  const secondaryCategoryFieldState = getFieldState
    ? getFieldState("secondary-category")
    : "";

  const [showSecondCategoryField, setShowSecondCategoryField] = useState(
    secondaryCategory ? true : false
  );

  useEffect(() => {
    setShowSecondCategoryField(secondaryCategory ? true : false);
  }, [secondaryCategory]);

  return (
    <>
      <Row
        className={`p-form__group ${
          primaryCategoryFieldState.invalid && "p-form-validation is-error"
        }`}
      >
        <Col size={2} data-tour="listing-category">
          <label htmlFor={primaryCategoryFieldId} className="p-form__label">
            Category:
          </label>
        </Col>
        <Col size={5}>
          <div className="p-form__control" data-tour="listing-category">
            <select
              name="primary-category"
              id={primaryCategoryFieldId}
              {...register("primary-category")}
              defaultValue={primaryCategory}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                  disabled={category.slug === secondaryCategory}
                >
                  {category.name}
                </option>
              ))}
              <option value="">None</option>
            </select>
          </div>
          {!showSecondCategoryField && (
            <>
              <Button
                appearance="link"
                onClick={() => {
                  setShowSecondCategoryField(true);
                }}
                data-testid="add-category-button"
              >
                +&nbsp;Add another category
              </Button>
              <p className="p-form-help-text">
                If your snap fits into multiple categories you can select
                another.
              </p>
            </>
          )}
        </Col>
      </Row>
      {showSecondCategoryField && (
        <Row
          className={`p-form__group ${
            secondaryCategoryFieldState.invalid && "p-form-validation is-error"
          }`}
        >
          <Col size={2}>
            <label htmlFor={secondaryCategoryFieldId} className="p-form__label">
              Second category:
            </label>
          </Col>
          <Col size={5}>
            <div className="p-form__control">
              <select
                name="secondary-category"
                id={secondaryCategoryFieldId}
                {...register("secondary-category")}
                defaultValue={secondaryCategory}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option
                    key={category.slug}
                    value={category.slug}
                    disabled={category.slug === primaryCategory}
                  >
                    {category.name}
                  </option>
                ))}
                <option value="">None</option>
              </select>
            </div>
          </Col>
          <Col size={2}>
            <Button
              appearance="base"
              onClick={() => {
                setValue("secondary-category", "", {
                  shouldDirty:
                    secondaryCategoryFieldState.isDirty || secondaryCategory,
                });
                setShowSecondCategoryField(false);
              }}
              data-testid="delete-category-button"
            >
              <Icon name="delete">Delete second category</Icon>
            </Button>
          </Col>
        </Row>
      )}
    </>
  );
}

export default CategoriesInput;
