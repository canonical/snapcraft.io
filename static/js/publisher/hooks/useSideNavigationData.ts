import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import {
  useAccountKeys,
  useBrand,
  useBrandStores,
  usePublisher,
  useValidationSets,
} from "./";
import { brandIdState, brandStoresState } from "../state/brandStoreState";
import { publisherState } from "../state/publisherState";
import { validationSetsState } from "../state/validationSetsState";
import { accountKeysState } from "../state/accountKeysState";

/**
 * Load all the data that is needed for side navigation, more specifically:
 * - the user's publisher information
 * - the list of brand stores the user has access to
 * - the brand ID of the currently selected store
 * - the list of validation sets
 *
 * The data is loaded into the appropriate Jotai state variables
 */
function useSideNavigationData() {
  const { id: storeId } = useParams();
  const { data: publisherData } = usePublisher();
  const { data: validationSetsData } = useValidationSets();
  const { data: brandStoresData } = useBrandStores();
  const { data: brandData } = useBrand(storeId);
  const { data: accountKeysData } = useAccountKeys();

  const setBrandStores = useSetAtom(brandStoresState);
  const setPublisher = useSetAtom(publisherState);
  const setBrandId = useSetAtom(brandIdState);
  const setValidationSets = useSetAtom(validationSetsState);
  const setAccountKeys = useSetAtom(accountKeysState);

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

  useEffect(() => {
    setAccountKeys(accountKeysData || accountKeysState.init);
  }, [accountKeysData]);
}

export default useSideNavigationData;
