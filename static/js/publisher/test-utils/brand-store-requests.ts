import { http, HttpResponse } from "msw";

import {
  accountResponse,
  snapsResponse,
  membersResponse,
  storesResponse,
  searchResponse,
} from "./brand-store-responses";

// @ts-expect-error - Unknown type
function brandStoreRequests(server) {
  server.use(
    http.get("/account.json", () => {
      return HttpResponse.json(accountResponse);
    }),
  );

  server.use(
    http.get("/api/store/test-store-id/snaps", () => {
      return HttpResponse.json(snapsResponse);
    }),
  );

  server.use(
    http.get("/api/store/test-store-id/members", () => {
      return HttpResponse.json(membersResponse);
    }),
  );

  server.use(
    http.get("/api/stores", () => {
      return HttpResponse.json({
        success: true,
        data: storesResponse,
      });
    }),
  );

  server.use(
    http.get(
      "/api/test-store-id/snaps/search?q=te&allowed_for_inclusion=test-store-id",
      () => {
        return HttpResponse.json(searchResponse);
      },
    ),
  );
}

export default brandStoreRequests;
