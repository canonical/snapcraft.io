import { useRef } from "react";
import { useQueries } from "react-query";

import Banner from "../../components/Banner";
import RecommendationsSection from "./RecommendationsSection";

import type { UseQueryResult } from "react-query";
import type { RecommendationData } from "../../types";

function Explore(): JSX.Element {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement | null>(null);
  const categories: string[] = ["popular", "recent", "trending"];

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

  const isLoading: boolean =
    !recommendations || recommendations.some((r) => r.isLoading);

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

      {recommendations && (
        <>
          {snaps.recent && (
            <RecommendationsSection
              snaps={snaps.recent}
              title="Recently updated snaps"
              isLoading={isLoading}
            />
          )}

          {snaps.popular && (
            <RecommendationsSection
              snaps={snaps.popular}
              title="Most popular snaps"
              isLoading={isLoading}
            />
          )}

          {snaps.trending && (
            <RecommendationsSection
              snaps={snaps.trending}
              title="Trending snaps"
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </>
  );
}

export default Explore;
