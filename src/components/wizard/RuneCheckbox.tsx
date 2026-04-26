import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface RuneCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const RuneCheckbox = forwardRef<HTMLInputElement, RuneCheckboxProps>(
  ({ label, hint, className, ...rest }, ref) => {
    return (
      <label
        className={cn(
          "group flex cursor-pointer items-start gap-3 border border-transparent p-3 transition-colors",
          "hover:border-[var(--gold-soft)] hover:bg-[oklch(0.20_0.02_70_/_0.5)]",
          className,
        )}
      >
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--gold-soft)] bg-[oklch(0.13_0.01_60)] transition-colors group-hover:border-gold">
          <input
            ref={ref}
            type="checkbox"
            className="peer absolute inset-0 cursor-pointer opacity-0"
            {...rest}
          />
          <span className="hidden font-display text-gold peer-checked:block">✦</span>
        </span>
        <span className="flex-1 leading-tight">
          <span className="block font-mono text-sm text-foreground">{label}</span>
          {hint && (
            <span className="mt-0.5 block text-xs italic text-muted-foreground">
              {hint}
            </span>
          )}
        </span>
      </label>
    );
  },
);
RuneCheckbox.displayName = "RuneCheckbox";
