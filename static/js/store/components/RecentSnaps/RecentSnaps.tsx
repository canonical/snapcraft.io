import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";
import { DefaultCard } from "@canonical/store-components";

import { useRecentSnaps } from "../../hooks";

import type { Package } from "../../types";

type PackageData = {
  details: {
    name: string;
    title: string;
    icon: string;
    developer_validation: string;
    publisher: string;
    summary: string;
  };
};

type Props = {
  title: string;
  highlight?: boolean;
};

function RecentSnaps({ title, highlight }: Props): ReactNode {
  const { data, isLoading } = useRecentSnaps();

  function formatPackageData(data: PackageData) {
    return {
      package: {
        name: data.details.name,
        display_name: data.details.title,
        icon_url: data.details.icon,
        description: data.details.summary,
      },
      publisher: {
        display_name: data.details.publisher,
        name: data.details.publisher,
        validation: data.details.developer_validation,
      },
    };
  }

  const selectedPackages = data ? data.slice(0, 8) : [];
  const packages = selectedPackages.map(formatPackageData);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h2>{title}</h2>
        <p>
          <a href="/store">See all</a>
        </p>
      </div>
      {!isLoading && packages.length > 0 && (
        <Strip shallow className="u-no-padding--bottom">
          <Row>
            {packages.map((packageData: Package) => (
              <Col
                size={3}
                key={packageData.package.name}
                style={{ marginBottom: "1.5rem" }}
              >
                <DefaultCard
                  data={packageData}
                  highlighted={highlight || false}
                />
              </Col>
            ))}
          </Row>
        </Strip>
      )}
    </>
  );
}

export default RecentSnaps;
