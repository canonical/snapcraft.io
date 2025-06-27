import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAtom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

const brandStoresAtom = atomWithQuery(() => ({
  queryKey: ["brandStores"],
  queryFn: async () => {
    const response = await fetch("/api/stores");

    if (!response.ok) {
      throw Error("Unable to fetch stores");
    }

    const responseData = await response.json();

    if (!responseData.success) {
      throw Error(responseData.message);
    }

    return responseData.data;
  },
}));

function BrandStoreBetaRoute() {
  const [{ data, isPending, isError }] = useAtom(brandStoresAtom);

  return (
    <Router>
      <Routes>
        <Route path="/admin-beta" element={<h1>Hi</h1>} />
      </Routes>
    </Router>
  );
}

export default BrandStoreBetaRoute;
