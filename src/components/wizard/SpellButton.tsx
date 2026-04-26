import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SpellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  loading?: boolean;
}

export const SpellButton = forwardRef<HTMLButtonElement, SpellButtonProps>(
  ({ className, variant = "ghost", loading, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("spell-button", variant === "primary" && "primary", className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? "Casting…" : children}
      </button>
    );
  },
);
SpellButton.displayName = "SpellButton";
