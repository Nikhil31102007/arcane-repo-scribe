import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface WizardInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const WizardInput = forwardRef<HTMLInputElement, WizardInputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-display text-xs uppercase tracking-[0.2em] text-gold"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn("wizard-input", error && "border-destructive", className)}
          {...rest}
        />
        {error && (
          <p className="text-sm italic text-destructive">{error}</p>
        )}
      </div>
    );
  },
);
WizardInput.displayName = "WizardInput";
