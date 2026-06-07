import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ScrollCard } from "@/components/wizard/ScrollCard";
import { SpellButton } from "@/components/wizard/SpellButton";
import { Loader } from "@/components/wizard/Loader";
import { StatusIndicator } from "@/components/wizard/StatusIndicator";
import { RuneCheckbox } from "@/components/wizard/RuneCheckbox";
import {
  applySelections,
  extractPrUrl,
  extractRepoLink,
  getAnalysis,
  type Analysis,
  type AnalysisStatus,
} from "@/services/api/codeplus";
import { extractError } from "@/services/api/client";

export const Route = createFileRoute("/_authenticated/analysis/$analysisId")({
  head: () => ({
    meta: [
      { title: "Divination — CodePlus" },
      {
        name: "description",
        content: "Inspect the divination's findings and inscribe selected changes.",
      },
    ],
  }),
  component: AnalysisPage,
});

/** Polling intervals */
const POLL_MS_ACTIVE = 2500;   // while processing
const POLL_MS_ERROR  = 6000;   // after a network error
const TERMINAL: AnalysisStatus[] = ["completed", "failed"];

interface ApplyForm {
  files: Record<string, boolean>;
  deps: Record<string, boolean>;
}

function AnalysisPage() {
  const { analysisId } = useParams({ from: "/_authenticated/analysis/$analysisId" });
  const navigate = useNavigate();

  const [analysis, setAnalysis]   = useState<Analysis | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [applying, setApplying]   = useState(false);
  const [applied, setApplied]     = useState(false);

  // Keep a ref so the polling callback always sees the latest status
  const statusRef = useRef<AnalysisStatus | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const poll = useCallback(async () => {
    try {
      const data = await getAnalysis(analysisId);
      setAnalysis(data);
      setFetchError(null);
      statusRef.current = data.status ?? null;

      if (!TERMINAL.includes(data.status)) {
        timerRef.current = setTimeout(poll, POLL_MS_ACTIVE);
      }
    } catch (err) {
      setFetchError(extractError(err));
      // Retry even on error, but back off
      if (!TERMINAL.includes(statusRef.current ?? "queued")) {
        timerRef.current = setTimeout(poll, POLL_MS_ERROR);
      }
    }
  }, [analysisId]);

  useEffect(() => {
    poll();
    return clearTimer;
  }, [poll]);

  /* ── derived data ──────────────────────────────────────────── */
  const result       = analysis?.result;
  const unusedFiles  = useMemo<string[]>(
    () => (Array.isArray(result?.unusedFiles) ? (result.unusedFiles as string[]) : []),
    [result],
  );
  const unusedDeps   = useMemo<string[]>(
    () => (Array.isArray(result?.unusedDeps) ? (result.unusedDeps as string[]) : []),
    [result],
  );
  const unusedExports = useMemo(
    () => (Array.isArray(result?.unusedExports) ? result.unusedExports : []),
    [result],
  );
  const prUrl   = analysis ? extractPrUrl(analysis) : undefined;
  const repoUrl = analysis ? extractRepoLink(analysis) : undefined;
  const status  = analysis?.status;

  /* ── form ──────────────────────────────────────────────────── */
  const { register, handleSubmit, watch, setValue } = useForm<ApplyForm>({
    defaultValues: { files: {}, deps: {} },
  });

  const filesValues = watch("files");
  const depsValues  = watch("deps");
  const selectedFileCount = Object.values(filesValues).filter(Boolean).length;
  const selectedDepCount  = Object.values(depsValues).filter(Boolean).length;
  const totalSelected     = selectedFileCount + selectedDepCount;

  const selectAll = (kind: "files" | "deps", items: string[], checked: boolean) => {
    items.forEach((item) => setValue(`${kind}.${item}`, checked));
  };

  /* ── apply ─────────────────────────────────────────────────── */
  const onApply = async (values: ApplyForm) => {
    if (!analysis) return;

    const files = Object.entries(values.files).filter(([, v]) => v).map(([k]) => k);
    const deps  = Object.entries(values.deps).filter(([, v]) => v).map(([k]) => k);

    if (files.length === 0 && deps.length === 0) {
      toast.error("Select at least one item to inscribe into the pull request.");
      return;
    }

    setApplying(true);
    try {
      const res = await applySelections(analysis.id, files, deps);
      toast.success("The ritual has begun — a pull request is being forged.");
      setApplied(true);

      const newId = res?.id;
      if (newId && String(newId) !== String(analysis.id)) {
        // Backend created a new analysis entry for the apply step
        navigate({
          to: "/analysis/$analysisId",
          params: { analysisId: String(newId) },
        });
      } else {
        // Stay on this page and restart polling (status will flip to applying_changes)
        setAnalysis((prev) =>
          prev ? { ...prev, status: "applying_changes" as AnalysisStatus } : prev,
        );
        clearTimer();
        timerRef.current = setTimeout(poll, POLL_MS_ACTIVE);
      }
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setApplying(false);
    }
  };

  /* ── render helpers ────────────────────────────────────────── */
  const canInteract = status === "waiting_for_user" && !applied;
  const hasResults  = unusedFiles.length > 0 || unusedDeps.length > 0 || unusedExports.length > 0;

  /* Loading skeleton (first load only) */
  if (!analysis && !fetchError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Loader label="Unrolling the scroll" />
      </div>
    );
  }

  /* Hard fetch error before we ever got data */
  if (fetchError && !analysis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ScrollCard title="The scroll is sealed">
          <p className="text-center italic text-destructive">{fetchError}</p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => { clearTimer(); poll(); }}
              className="spell-button"
            >
              Retry
            </button>
            <Link to="/" className="spell-button">
              Return to Atelier
            </Link>
          </div>
        </ScrollCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">

      {/* ── Status Card ─────────────────────────────────────── */}
      <ScrollCard
        title={`Scroll №${analysis!.id}`}
        subtitle={repoUrl}
      >
        <StatusIndicator status={status ?? "queued"} />

        {analysis?.message && (
          <p className="mt-5 text-center italic text-muted-foreground">
            {analysis.message}
          </p>
        )}

        {/* Soft poll-error notice (we keep retrying) */}
        {fetchError && (
          <p className="mt-4 text-center text-xs italic text-destructive/70">
            ⚠ {fetchError} — retrying…
          </p>
        )}

        {/* Live pulse while not terminal */}
        {status && !TERMINAL.includes(status) && (
          <div className="mt-6 flex items-center justify-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            Live — refreshing every {POLL_MS_ACTIVE / 1000}s
          </div>
        )}
      </ScrollCard>

      {/* ── Failed ──────────────────────────────────────────── */}
      {status === "failed" && (
        <ScrollCard title="The Spell Has Failed">
          <p className="text-center italic text-destructive">
            {analysis?.error ?? analysis?.message ?? "An unknown failure befell the ritual."}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/" className="spell-button primary">
              Try Another Repository
            </Link>
          </div>
        </ScrollCard>
      )}

      {/* ── PR Complete ─────────────────────────────────────── */}
      {status === "completed" && prUrl && (
        <ScrollCard title="Inscription Complete">
          <p className="text-center italic text-muted-foreground">
            The pull request has been forged and submitted to the repository.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="spell-button primary"
            >
              View Pull Request →
            </a>
            <Link to="/" className="spell-button">
              New Divination
            </Link>
          </div>
        </ScrollCard>
      )}

      {/* ── Completed but no PR url yet ─────────────────────── */}
      {status === "completed" && !prUrl && (
        <ScrollCard title="Divination Complete">
          <p className="text-center italic text-muted-foreground">
            {hasResults
              ? "The wizard has finished divining. Review the findings below."
              : "No unused files, dependencies, or exports were found. Your codex is clean."}
          </p>
          {!hasResults && (
            <div className="mt-6 flex justify-center">
              <Link to="/" className="spell-button primary">New Divination</Link>
            </div>
          )}
        </ScrollCard>
      )}

      {/* ── Applying changes ────────────────────────────────── */}
      {status === "applying_changes" && (
        <ScrollCard title="Inscribing Changes">
          <Loader label="Quill to parchment" />
          <p className="mt-4 text-center text-sm italic text-muted-foreground">
            The wizard is creating your pull request…
          </p>
        </ScrollCard>
      )}

      {/* ── Results + selection form ─────────────────────────── */}
      {hasResults && (status === "waiting_for_user" || status === "completed") && (
        <form onSubmit={handleSubmit(onApply)} className="space-y-8">

          {/* Summary banner */}
          <div className="border border-[var(--gold-soft)] bg-[oklch(0.18_0.014_65_/_0.6)] px-5 py-3 text-center font-display text-xs uppercase tracking-[0.2em] text-gold">
            {unusedFiles.length > 0 && `${unusedFiles.length} unused file${unusedFiles.length !== 1 ? "s" : ""}`}
            {unusedFiles.length > 0 && unusedDeps.length > 0 && "  ·  "}
            {unusedDeps.length > 0 && `${unusedDeps.length} unused dep${unusedDeps.length !== 1 ? "s" : ""}`}
            {(unusedFiles.length > 0 || unusedDeps.length > 0) && unusedExports.length > 0 && "  ·  "}
            {unusedExports.length > 0 && `${unusedExports.length} unused export${unusedExports.length !== 1 ? "s" : ""}`}
          </div>

          {/* ── Unused Files ──────────────────────────────────── */}
          {unusedFiles.length > 0 && (
            <ScrollCard
              title="Unused Files"
              subtitle="Files that appear to have no importers in your codebase."
            >
              <div className="mb-3 flex items-center gap-4 border-b border-[var(--gold-soft)] pb-3">
                <button
                  type="button"
                  className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:underline"
                  onClick={() => selectAll("files", unusedFiles, true)}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                  onClick={() => selectAll("files", unusedFiles, false)}
                >
                  Clear
                </button>
                {selectedFileCount > 0 && (
                  <span className="ml-auto font-display text-[0.65rem] uppercase tracking-[0.15em] text-gold">
                    {selectedFileCount} selected
                  </span>
                )}
              </div>
              <div className="grid gap-1 md:grid-cols-2">
                {unusedFiles.map((file) => (
                  <RuneCheckbox
                    key={file}
                    label={file}
                    value={file}
                    disabled={!canInteract}
                    {...register(`files.${file}` as const)}
                  />
                ))}
              </div>
            </ScrollCard>
          )}

          {/* ── Unused Dependencies ───────────────────────────── */}
          {unusedDeps.length > 0 && (
            <ScrollCard
              title="Unused Dependencies"
              subtitle="Packages listed in package.json but not imported anywhere."
            >
              <div className="mb-3 flex items-center gap-4 border-b border-[var(--gold-soft)] pb-3">
                <button
                  type="button"
                  className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:underline"
                  onClick={() => selectAll("deps", unusedDeps, true)}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                  onClick={() => selectAll("deps", unusedDeps, false)}
                >
                  Clear
                </button>
                {selectedDepCount > 0 && (
                  <span className="ml-auto font-display text-[0.65rem] uppercase tracking-[0.15em] text-gold">
                    {selectedDepCount} selected
                  </span>
                )}
              </div>
              <div className="grid gap-1 md:grid-cols-2">
                {unusedDeps.map((dep) => (
                  <RuneCheckbox
                    key={dep}
                    label={dep}
                    value={dep}
                    disabled={!canInteract}
                    {...register(`deps.${dep}` as const)}
                  />
                ))}
              </div>
            </ScrollCard>
          )}

          {/* ── Unused Exports (read-only) ────────────────────── */}
          {unusedExports.length > 0 && (
            <ScrollCard
              title="Unused Exports"
              subtitle="Exported symbols with no external consumers — remove manually if desired."
            >
              <ul className="space-y-2 font-mono text-sm">
                {unusedExports.map((ex, i) => {
                  const text =
                    typeof ex === "string"
                      ? ex
                      : `${(ex as { file?: string }).file ?? "?"} → ${(ex as { name?: string }).name ?? "?"}`;
                  return (
                    <li
                      key={i}
                      className="border-l-2 border-[var(--gold-soft)] pl-3 text-muted-foreground"
                    >
                      {text}
                    </li>
                  );
                })}
              </ul>
            </ScrollCard>
          )}

          {/* ── Submit bar ───────────────────────────────────── */}
          {canInteract && (
            <div className="sticky bottom-4 z-10">
              <div className="rounded-none border border-[var(--gold-soft)] bg-[oklch(0.14_0.012_60_/_0.92)] p-4 shadow-[0_0_40px_-8px_var(--gold-glow)] backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {totalSelected > 0
                      ? `${totalSelected} item${totalSelected !== 1 ? "s" : ""} selected for inscription`
                      : "Select items above to forge a pull request"}
                  </p>
                  <SpellButton
                    type="submit"
                    variant="primary"
                    loading={applying}
                    disabled={totalSelected === 0 || applying}
                    className="whitespace-nowrap"
                  >
                    {applying ? "Forging PR…" : "Forge Pull Request"}
                  </SpellButton>
                </div>
              </div>
            </div>
          )}

          {/* Applied confirmation */}
          {applied && status !== "applying_changes" && status !== "completed" && (
            <div className="border border-[var(--gold-soft)] bg-[oklch(0.20_0.02_75_/_0.5)] p-4 text-center font-display text-xs uppercase tracking-[0.2em] text-gold">
              ✦ Inscription submitted — awaiting the forge
            </div>
          )}
        </form>
      )}
    </div>
  );
}