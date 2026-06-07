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
  id: number | string;
  status: AnalysisStatus;
  repoLink?: string;
  repo_link?: string;
  userType?: string;
  result?: AnalysisResult;
  prUrl?: string;
  pr_url?: string;
  pullRequestUrl?: string;
  pull_request_url?: string;
  error?: string;
  message?: string;
  [k: string]: unknown;
}

export interface ApplyResponse {
  id?: number | string;
  status?: AnalysisStatus;
  prUrl?: string;
  pr_url?: string;
  pullRequestUrl?: string;
  pull_request_url?: string;
  [k: string]: unknown;
}

/** Normalise any envelope shape the backend might return */
function unwrap<T>(payload: unknown): T {
  if (payload == null) return payload as T;
  if (typeof payload !== "object") return payload as T;

  const obj = payload as Record<string, unknown>;

  // Detect error envelopes: { status: "error" | "fail", message: "..." }
  if (
    (obj.status === "error" || obj.status === "fail") &&
    !("id" in obj) &&
    !("data" in obj)
  ) {
    throw new Error(
      typeof obj.message === "string"
        ? obj.message
        : typeof obj.error === "string"
          ? obj.error
          : "Backend returned an error",
    );
  }

  // { status, data: { ... } }
  if ("data" in obj && obj.data !== undefined && obj.data !== null) {
    return obj.data as T;
  }
  // { status, result: { ... } }
  if ("result" in obj && obj.result !== undefined && obj.result !== null) {
    return obj.result as T;
  }
  return payload as T;
}

/** Pull the PR url from whichever field the server used */
export function extractPrUrl(obj: Analysis | ApplyResponse): string | undefined {
  return (
    obj.prUrl ??
    obj.pr_url ??
    obj.pullRequestUrl ??
    obj.pull_request_url ??
    undefined
  );
}

/** Pull repoLink from whichever field the server used */
export function extractRepoLink(obj: Analysis): string | undefined {
  return obj.repoLink ?? obj.repo_link ?? undefined;
}

export async function startAnalysis(repoLink: string, userType: string): Promise<Analysis> {
  const { data } = await api.post("/analyze", { repoLink, userType });
  const analysis = unwrap<Analysis>(data);
  // Ensure we have an id
  if (!analysis?.id) {
    throw new Error("Backend did not return an analysis id");
  }
  return analysis;
}

export async function getAnalysis(id: number | string): Promise<Analysis> {
  const { data } = await api.get(`/analyze/${id}`);
  return unwrap<Analysis>(data);
}

export async function applySelections(
  analysisId: number | string,
  files: string[],
  deps: string[],
): Promise<ApplyResponse> {
  const { data } = await api.post(`/analyze/${analysisId}/apply`, { files, deps });
  return unwrap<ApplyResponse>(data);
}