import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ScrollCard } from "@/components/wizard/ScrollCard";
import { SpellButton } from "@/components/wizard/SpellButton";
import { Loader } from "@/components/wizard/Loader";
import { StatusIndicator } from "@/components/wizard/StatusIndicator";
import { RuneCheckbox } from "@/components/wizard/RuneCheckbox";
import {
  applySelections,
  getAnalysis,
  type Analysis,
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

const POLL_MS = 3000;

interface ApplyForm {
  files: Record<string, boolean>;
  deps: Record<string, boolean>;
}

function AnalysisPage() {
  const { analysisId } = useParams({ from: "/_authenticated/analysis/$analysisId" });
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Polling effect
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const data = await getAnalysis(analysisId);
        if (cancelled) return;
        setAnalysis(data);
        setError(null);

        const terminal = data.status === "completed" || data.status === "failed";
        if (!terminal) {
          timer = window.setTimeout(tick, POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(extractError(err));
        timer = window.setTimeout(tick, POLL_MS * 2);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [analysisId]);

  const result = analysis?.result;
  const unusedFiles = useMemo<string[]>(
    () => (Array.isArray(result?.unusedFiles) ? (result.unusedFiles as string[]) : []),
    [result],
  );
  const unusedDeps = useMemo<string[]>(
    () => (Array.isArray(result?.unusedDeps) ? (result.unusedDeps as string[]) : []),
    [result],
  );
  const unusedExports = useMemo(
    () => (Array.isArray(result?.unusedExports) ? result.unusedExports : []),
    [result],
  );

  const { register, handleSubmit, reset } = useForm<ApplyForm>({
    defaultValues: { files: {}, deps: {} },
  });

  // Reset form defaults when fresh data arrives, only the first time we see results
  useEffect(() => {
    if (unusedFiles.length || unusedDeps.length) {
      reset({ files: {}, deps: {} });
    }
    // We deliberately key on lengths so we don't reset on every poll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unusedFiles.length, unusedDeps.length, reset]);

  const prUrl = analysis?.prUrl ?? analysis?.pullRequestUrl;
  const status = analysis?.status;

  const onApply = async (values: ApplyForm) => {
    if (!analysis) return;
    const files = Object.entries(values.files).filter(([, v]) => v).map(([k]) => k);
    const deps = Object.entries(values.deps).filter(([, v]) => v).map(([k]) => k);

    if (files.length === 0 && deps.length === 0) {
      toast.error("Choose at least one rune to inscribe.");
      return;
    }

    setApplying(true);
    try {
      const res = await applySelections(Number(analysis.id), files, deps);
      toast.success("The inscription has begun.");
      // If the apply endpoint returned a fresh analysis id, navigate to it; otherwise stay
      if (res?.id && res.id !== analysis.id) {
        navigate({
          to: "/analysis/$analysisId",
          params: { analysisId: String(res.id) },
        });
      } else {
        // Force immediate poll
        setAnalysis((prev) =>
          prev ? { ...prev, status: "applying_changes" as const } : prev,
        );
      }
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setApplying(false);
    }
  };

  if (!analysis && !error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Loader label="Opening the scroll" />
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ScrollCard title="The scroll is sealed">
          <p className="text-center italic text-destructive">{error}</p>
          <div className="mt-6 text-center">
            <Link to="/" className="spell-button inline-block">
              Return to Atelier
            </Link>
          </div>
        </ScrollCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <ScrollCard
        title={`Scroll №${analysis!.id}`}
        subtitle={analysis!.repoLink}
      >
        <StatusIndicator status={status ?? "queued"} />
        {analysis?.message && (
          <p className="mt-6 text-center italic text-muted-foreground">
            {analysis.message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm italic text-destructive">
            ⚠ {error} — retrying…
          </p>
        )}
      </ScrollCard>

      {status === "failed" && (
        <ScrollCard title="The Spell Has Failed">
          <p className="text-center italic text-destructive">
            {analysis?.error ?? analysis?.message ?? "An unknown failure befell the ritual."}
          </p>
          <div className="mt-6 text-center">
            <Link to="/" className="spell-button inline-block">
              Try Another Repository
            </Link>
          </div>
        </ScrollCard>
      )}

      {status === "completed" && prUrl && (
        <ScrollCard title="Inscription Complete">
          <p className="text-center italic text-muted-foreground">
            The pull request has been forged and committed to the codex.
          </p>
          <div className="mt-6 flex justify-center gap-4">
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

      {(status === "waiting_for_user" || status === "completed") &&
        (unusedFiles.length > 0 ||
          unusedDeps.length > 0 ||
          unusedExports.length > 0) && (
          <form onSubmit={handleSubmit(onApply)} className="space-y-8">
            {unusedFiles.length > 0 && (
              <ScrollCard
                title="Unused Files"
                subtitle="Select files to be banished from the codex."
              >
                <div className="grid gap-1 md:grid-cols-2">
                  {unusedFiles.map((file) => (
                    <RuneCheckbox
                      key={file}
                      label={file}
                      value={file}
                      {...register(`files.${file}` as const)}
                    />
                  ))}
                </div>
              </ScrollCard>
            )}

            {unusedDeps.length > 0 && (
              <ScrollCard
                title="Unused Dependencies"
                subtitle="Select packages to be removed from the manifest."
              >
                <div className="grid gap-1 md:grid-cols-2">
                  {unusedDeps.map((dep) => (
                    <RuneCheckbox
                      key={dep}
                      label={dep}
                      value={dep}
                      {...register(`deps.${dep}` as const)}
                    />
                  ))}
                </div>
              </ScrollCard>
            )}

            {unusedExports.length > 0 && (
              <ScrollCard
                title="Unused Exports"
                subtitle="Observed by the wizard — review and remove manually."
              >
                <ul className="space-y-2 font-mono text-sm">
                  {unusedExports.map((ex, i) => {
                    const text =
                      typeof ex === "string"
                        ? ex
                        : `${ex.file ?? "?"} → ${ex.name ?? "?"}`;
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

            {status === "waiting_for_user" && (
              <div className="flex justify-center gap-4">
                <SpellButton
                  type="submit"
                  variant="primary"
                  loading={applying || status !== "waiting_for_user"}
                >
                  Inscribe Selected Changes
                </SpellButton>
              </div>
            )}
          </form>
        )}

      {status === "applying_changes" && (
        <ScrollCard title="Inscribing Changes">
          <Loader label="Quill to parchment" />
        </ScrollCard>
      )}
    </div>
  );
}
