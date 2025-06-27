import { useRef } from "react";
import { useQueries } from "react-query";
import { Strip, Row, Col } from "@canonical/react-components";

import Banner from "../../components/Banner";
import RecommendationsSection from "./RecommendationsSection";
import EditorialSection from "./EditorialSection";
import ListSection from "./ListSection";
import Categories from "./Categories";

import type { UseQueryResult } from "react-query";
import type { RecommendationData, SlicesData } from "../../types";

function Explore(): JSX.Element {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement | null>(null);
  const categories: string[] = ["popular", "recent", "trending"];
  const sliceIds: string[] = ["our_picks"];

  const slices = useQueries(
    sliceIds.map((sliceId) => ({
      queryKey: ["slices", sliceId],
      queryFn: async () => {
        const response = await fetch(
          `https://recommendations.snapcraft.io/api/slice/${sliceId}`,
        );

        if (!response.ok) {
          throw Error(`Unable to fetch ${sliceId} data`);
        }

        const responseData = await response.json();

        return responseData;
      },
    })),
  );

  const slicesLoading: boolean = slices.some((s) => s.isLoading);

  const slicesData: Record<string, SlicesData> = {};

  if (slices) {
    slices.forEach((slice) => {
      if (slice.data) {
        slicesData[slice.data.slice.id] = slice.data;
      }
    });
  }

  const recommendations: UseQueryResult<{
    name: string;
    snaps: RecommendationData[];
  }>[] = useQueries(
    categories.map((category) => ({
      queryKey: ["recommendations", category],
      queryFn: async () => {
        const response = await fetch(
          `https://recommendations.snapcraft.io/api/category/${category}`,
        );

        if (!response.ok) {
          throw Error(`Unable to fetch ${category} data`);
        }

        const responseData = await response.json();

        return {
          name: category,
          snaps: responseData,
        };
      },
    })),
  );

  const recommendationsLoading: boolean = recommendations.some(
    (r) => r.isLoading,
  );

  const snaps: Record<string, RecommendationData[]> = {};

  if (recommendations) {
    recommendations.forEach((recommendation) => {
      if (recommendation.data) {
        snaps[recommendation.data.name] = recommendation.data.snaps.slice(0, 6);
      }
    });
  }

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />

      {slices && (
        <>
          {slicesData.our_picks && (
            <Strip className="u-no-padding--bottom">
              <EditorialSection
                isLoading={slicesLoading}
                slice={slicesData.our_picks}
                gradient="purplePink"
              />
            </Strip>
          )}
        </>
      )}

      {recommendations && (
        <>
          {snaps.recent && (
            <Strip shallow className="u-no-padding--bottom">
              <RecommendationsSection
                snaps={snaps.recent}
                title="Recently updated snaps"
                isLoading={recommendationsLoading}
                highlight={true}
              />
            </Strip>
          )}

          {snaps.popular && (
            <Strip shallow className="u-no-padding--bottom">
              <ListSection
                snaps={snaps.popular}
                title="Most popular snaps"
                isLoading={recommendationsLoading}
              />
            </Strip>
          )}
        </>
      )}

      <Strip shallow className="u-no-padding--top">
        <Categories />
      </Strip>

      {/* Placeholder until content is decided */}
      {slices && (
        <>
          {slicesData.our_picks && (
            <Strip shallow className="u-no-padding--top u-no-padding--bottom">
              <EditorialSection
                isLoading={slicesLoading}
                slice={slicesData.our_picks}
                gradient="blueGreen"
              />
            </Strip>
          )}
        </>
      )}

      {recommendations && snaps.trending && (
        <Strip shallow>
          <RecommendationsSection
            snaps={snaps.trending}
            title="Trending snaps"
            isLoading={recommendationsLoading}
          />
        </Strip>
      )}

      <Strip className="u-no-padding--top">
        <div
          style={{
            backgroundImage:
              "url('https://assets.ubuntu.com/v1/e888a79f-suru.png')",
            backgroundPosition: "top right",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#f3f3f3",
            padding: "67px",
          }}
        >
          <Row>
            <Col size={6}>
              <h2>Learn how to snap in 30 minutes</h2>
              <p className="p-heading--4">
                Find out how to build and publish snaps
              </p>
              <a className="p-button--positive" href="/docs/get-started">
                Get started
              </a>
            </Col>
          </Row>
        </div>
      </Strip>
    </>
  );
}

export default Explore;
