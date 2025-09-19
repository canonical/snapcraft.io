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
    setBrandId(brandData?.["account-id"] || brandIdState.init);
  }, [brandData]);

  useEffect(() => {
    setBrandStores(brandStoresData || brandStoresState.init);
  }, [brandStoresData]);

  useEffect(() => {
    setPublisher(publisherData?.publisher || publisherState.init);
  }, [publisherData]);

  useEffect(() => {
    setValidationSets(validationSetsData || validationSetsState.init);
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
