export { api } from "@/api/http";

// Back-compat exports (older code imports these names)
export {
  setAxiosAccessToken as setAccessToken,
  API_BASE_URL,
} from "@/api/http";
