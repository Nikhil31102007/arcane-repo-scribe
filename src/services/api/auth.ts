import { api } from "./client";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface ApiEnvelope<T> {
  status: string;
  message?: string;
  data: T;
}

export async function login(username: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<ApiEnvelope<AuthTokens>>("/auth/login", {
    username,
    password,
  });
  return data.data;
}

export async function register(username: string, password: string): Promise<AuthTokens> {
  // Register then login (backend register returns user, not tokens)
  await api.post("/auth/register", { username, password });
  return login(username, password);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<ApiEnvelope<AuthTokens>>("/auth/refresh", {
    token: refreshToken,
  });
  return data.data;
}
