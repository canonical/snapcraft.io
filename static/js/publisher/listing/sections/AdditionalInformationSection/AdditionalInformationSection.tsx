import React from "react";

import LicenseInputs from "../../components/LicenseInputs";
import MetricsInputs from "../../components/MetricsInputs";

type Props = {
  register: Function;
  setValue: Function;
  watch: Function;
  listingData: {
    public_metrics_enabled: boolean;
    public_metrics_blacklist: Array<string>;
    license: string;
    license_type: string;
    licenses: Array<{ key: string; name: string }>;
  };
};

function AdditionalInformationSection({
  register,
  listingData,
  setValue,
  watch,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Additional information</h2>
      </div>

      <LicenseInputs
        listingData={listingData}
        register={register}
        setValue={setValue}
        watch={watch}
      />

      <MetricsInputs
        register={register}
        listingData={listingData}
        setValue={setValue}
      />
    </>
  );
}

export default AdditionalInformationSection;
