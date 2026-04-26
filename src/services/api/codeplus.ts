import { api } from "./client";

export type AnalysisStatus =
  | "queued"
  | "processing"
  | "waiting_for_user"
  | "applying_changes"
  | "completed"
  | "failed";

export interface AnalysisResult {
  unusedFiles?: string[];
  unusedDeps?: string[];
  unusedExports?: Array<{ file: string; name: string } | string>;
  [k: string]: unknown;
}

export interface Analysis {
  id: number;
  status: AnalysisStatus;
  repoLink?: string;
  userType?: string;
  result?: AnalysisResult;
  prUrl?: string;
  pullRequestUrl?: string;
  error?: string;
  message?: string;
  [k: string]: unknown;
}

interface Envelope<T> {
  status: string;
  message?: string;
  data: T;
}

function unwrap<T>(payload: unknown): T {
  // Backend may return { data: ... } envelope or raw object
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    const env = payload as Envelope<T>;
    if (env.data !== undefined) return env.data;
  }
  return payload as T;
}

export async function startAnalysis(
  repoLink: string,
  userType: string,
): Promise<Analysis> {
  const { data } = await api.post("/analyze", { repoLink, userType });
  return unwrap<Analysis>(data);
}

export async function getAnalysis(id: number | string): Promise<Analysis> {
  const { data } = await api.get(`/analyze/${id}`);
  return unwrap<Analysis>(data);
}

export interface ApplyResponse {
  id?: number;
  status?: AnalysisStatus;
  prUrl?: string;
  pullRequestUrl?: string;
  [k: string]: unknown;
}

export async function applySelections(
  analysisId: number,
  files: string[],
  deps: string[],
): Promise<ApplyResponse> {
  const { data } = await api.post("/apply", { analysisId, files, deps });
  return unwrap<ApplyResponse>(data);
}
