import { createApiClient } from "@savemate/api-client";

import { api } from "./axios";

export const typedApi = createApiClient(api);
