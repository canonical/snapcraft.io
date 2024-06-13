import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdditionalInformationSection from "../AdditionalInformationSection";

const renderComponent = () => {
  return render(
    <AdditionalInformationSection
      register={jest.fn()}
      setValue={jest.fn()}
      watch={() => {
        return {
          unsubscribe: jest.fn(),
        };
      }}
      listingData={{
        public_metrics_enabled: false,
        public_metrics_blacklist: [],
        license: "test",
        license_type: "test",
        licenses: [],
      }}
    />
  );
};

describe("AdditionalInformationSection", () => {
  test("shows the correct section", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { level: 2, name: "Additional information" })
    ).toBeInTheDocument();
  });
});
