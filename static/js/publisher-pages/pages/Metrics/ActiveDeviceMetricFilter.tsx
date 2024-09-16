import { Col, Select } from "@canonical/react-components";

interface IActiveDeviceMetricFilterProps {
  isEmpty: boolean;
  period: string;
  type: string;
  onChange: (field: string, value: string) => void;
}

export const ActiveDeviceMetricFilter = ({
  isEmpty,
  onChange,
  period,
  type,
}: IActiveDeviceMetricFilterProps) => {
  console.log();
  return (
    <>
      <Col size={3} key="periodFilter">
        <Select
          className="p-form__control"
          disabled={isEmpty}
          value={period}
          onChange={(event) => onChange("period", event.target.value)}
          options={[
            {
              label: "Past 7 days",
              value: "7d",
            },
            {
              label: "Past 30 days",
              value: "30d",
            },
            {
              label: "Past 3 months",
              value: "3m",
            },
            {
              label: "Past 6 months",
              value: "6m",
            },
            {
              label: "Past year",
              value: "1y",
            },
            {
              label: "Past 2 years",
              value: "2y",
            },
            {
              label: "Past 5 years",
              value: "5y",
            },
          ]}
        />
      </Col>
      <Col size={3} key="typeFilter">
        <Select
          className="p-form__control"
          disabled={isEmpty}
          value={type}
          onChange={(event) => onChange("active-devices", event.target.value)}
          options={[
            { label: "By version", value: "version" },
            { label: "By OS", value: "os" },
            { label: "By channel", value: "channel" },
            { label: "By architecture", value: "architecture" },
          ]}
        />
      </Col>
    </>
  );
};
