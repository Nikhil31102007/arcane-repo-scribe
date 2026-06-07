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

const DOT_COLORS: Partial<Record<AnalysisStatus, string>> = {
  completed: "bg-gold border-gold",
  failed: "bg-destructive border-destructive",
};

export function StatusIndicator({ status }: { status: AnalysisStatus }) {
  const isFailed = status === "failed";
  const isCompleted = status === "completed";
  const isTerminal = isFailed || isCompleted;
  const currentIdx = ORDER.indexOf(status);

  return (
    <div className="space-y-5">
      {/* Main badge */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full border",
            isFailed
              ? "border-destructive bg-destructive"
              : isCompleted
                ? "border-gold bg-gold"
                : "border-gold bg-gold animate-pulse",
          )}
          style={!isTerminal ? { boxShadow: "0 0 10px var(--gold-glow)" } : undefined}
        />
        <span
          className={cn(
            "font-display text-sm uppercase tracking-[0.2em]",
            isFailed ? "text-destructive" : "text-gold",
          )}
          style={!isFailed ? { textShadow: "0 0 16px var(--gold-glow)" } : undefined}
        >
          {LABELS[status] ?? status}
        </span>
      </div>

      {/* Step trail */}
      {!isFailed && (
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 font-mono text-[0.68rem] uppercase tracking-widest">
          {ORDER.map((s, i) => {
            const reached = i <= currentIdx;
            const active = s === status;
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full border transition-all duration-300",
                    DOT_COLORS[s] ??
                    (reached ? "border-gold bg-gold" : "border-[var(--gold-soft)] bg-transparent"),
                    active && !isCompleted && "shadow-[0_0_6px_var(--gold-glow)]",
                  )}
                />
                <span
                  className={cn(
                    "transition-colors duration-300",
                    active ? "text-gold" : reached ? "text-gold/60" : "text-muted-foreground/50",
                  )}
                >
                  {s.replace(/_/g, " ")}
                </span>
                {i < ORDER.length - 1 && (
                  <span className="text-muted-foreground/30">·</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}