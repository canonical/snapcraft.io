import type { CardData, RecommendationData } from "../types";

function formatCardData(data: RecommendationData): CardData {
  return {
    package: {
      description: data.details.summary,
      display_name: data.details.title,
      icon_url: data.details.icon,
      name: data.details.name,
    },
    publisher: {
      display_name: data.details.publisher,
      name: data.details.publisher,
      validation: data.details.developer_validation,
    },
  };
}

export default formatCardData;
