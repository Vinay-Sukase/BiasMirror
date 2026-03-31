import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-white/12 bg-white/10 p-8 shadow-[0_24px_80px_rgba(9,6,24,0.45)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
