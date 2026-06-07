import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

// When VITE_API_URL is not set we use "/api" so requests go through the
// Vite dev-server proxy (vite.config.ts: /api → http://localhost:3000).
// This avoids CORS entirely in development.
const BASE_URL =
  import.meta.env.VITE_API_URL ?? "/api";

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type LogoutHandler = () => void;

let getAccessToken: TokenGetter = () => null;
let onRefresh: RefreshHandler = async () => null;
let onLogout: LogoutHandler = () => {};

export function configureApiClient(opts: {
  getAccessToken: TokenGetter;
  onRefresh: RefreshHandler;
  onLogout: LogoutHandler;
}) {
  getAccessToken = opts.getAccessToken;
  onRefresh = opts.onRefresh;
  onLogout = opts.onLogout;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // must be false when backend uses wildcard CORS origin
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

console.log("[API] baseURL:", BASE_URL);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  console.log("[API] →", config.method?.toUpperCase(), config.baseURL + config.url, { hasToken: !!token });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers["x-access-token"] = token;
    config.headers["access-token"] = token;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const status = error.response?.status;
    const isAuthEndpoint = original?.url?.includes("/auth/");

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = onRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          original.headers["x-access-token"] = newToken;
          original.headers["access-token"] = newToken;
          return api.request(original);
        }
      } catch {
        // fallthrough to logout
      }
      onLogout();
    }
    return Promise.reject(error);
  },
);

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string; status?: string }
      | undefined;
    return data?.error ?? data?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "An unknown error occurred";
}

export const API_BASE_URL = BASE_URL;
