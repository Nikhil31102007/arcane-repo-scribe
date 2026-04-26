export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div
        className="h-12 w-12 animate-spin border border-[var(--gold-soft)] border-t-gold"
        style={{ borderRadius: "50%", boxShadow: "0 0 24px var(--gold-glow)" }}
      />
      {label && (
        <p className="font-display text-xs uppercase tracking-[0.2em] text-gold">
          {label}
        </p>
      )}
    </div>
  );
}
