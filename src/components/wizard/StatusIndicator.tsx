import type { AnalysisStatus } from "@/services/api/codeplus";
import { cn } from "@/lib/utils";

const LABELS: Record<AnalysisStatus, string> = {
  queued: "Queued in the spellbook",
  processing: "Divining the codebase",
  waiting_for_user: "Awaiting your decree",
  applying_changes: "Inscribing changes",
  completed: "Ritual complete",
  failed: "The spell has failed",
};

const ORDER: AnalysisStatus[] = [
  "queued",
  "processing",
  "waiting_for_user",
  "applying_changes",
  "completed",
];

export function StatusIndicator({ status }: { status: AnalysisStatus }) {
  const isFailed = status === "failed";
  const currentIdx = ORDER.indexOf(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            isFailed
              ? "bg-destructive"
              : status === "completed"
                ? "bg-gold"
                : "bg-gold animate-pulse",
          )}
          style={
            !isFailed
              ? { boxShadow: "0 0 12px var(--gold-glow)" }
              : undefined
          }
        />
        <span className="font-display text-sm uppercase tracking-[0.2em] text-gold">
          {LABELS[status]}
        </span>
      </div>

      {!isFailed && (
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          {ORDER.map((s, i) => {
            const reached = i <= currentIdx;
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full border",
                    reached
                      ? "border-gold bg-gold"
                      : "border-[var(--gold-soft)] bg-transparent",
                  )}
                />
                <span className={cn(reached && "text-gold")}>
                  {s.replace(/_/g, " ")}
                </span>
                {i < ORDER.length - 1 && <span className="opacity-30">·</span>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
