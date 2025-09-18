import { useAtom } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { useBrand, useBrandStores, usePublisher, useValidationSets } from "./";
import { brandIdState, brandStoresState } from "../state/brandStoreState";
import { publisherState } from "../state/publisherState";
import { validationSetsState } from "../state/validationSetsState";

// load all data that's needed for side navigation
function useSideNavigationData() {
  const { id: storeId } = useParams();
  const { data: publisherData } = usePublisher();
  const { data: validationSetsData } = useValidationSets();
  const { data: brandStoresData } = useBrandStores();
  const { data: brandData } = useBrand(storeId);

  const [brandStores, setBrandStores] = useAtom(brandStoresState);
  const [publisher, setPublisher] = useAtom(publisherState);
  const [brandId, setBrandId] = useAtom(brandIdState);
  const [validationSets, setValidationSets] = useAtom(validationSetsState);

  useEffect(() => {
    if (brandData) {
      setBrandId(brandData?.["account-id"]);
    } else {
      setBrandId("");
    }
  }, [brandData]);

  useEffect(() => {
    if (brandStoresData) {
      setBrandStores(brandStoresData);
    }
  }, [brandStoresData]);

  useEffect(() => {
    if (publisherData) {
      setPublisher(publisherData.publisher);
    }
  }, [publisherData]);

  useEffect(() => {
    if (validationSetsData) {
      setValidationSets(validationSetsData);
    }
  }, [validationSetsData]);

  return {
    storeId,
    brandId,
    brandStores,
    publisher,
    validationSets,
  };
}

export default useSideNavigationData;
