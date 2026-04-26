import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function ScrollCard({ title, subtitle, children, className, ...rest }: ScrollCardProps) {
  return (
    <div className={cn("parchment p-8 md:p-10", className)} {...rest}>
      {title && (
        <header className="mb-6 text-center">
          <h2 className="gold-text text-2xl md:text-3xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="mt-2 italic text-muted-foreground">{subtitle}</p>
          )}
          <div className="rune-divider mt-5" />
        </header>
      )}
      {children}
    </div>
  );
}
