import * as React from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  color?: "violet" | "emerald" | "blue" | "amber" | "pink";
  showLabel?: boolean;
  animated?: boolean;
}

const sizeMap: Record<string, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
};

const colorMap: Record<string, string> = {
  violet: "from-violet-600 to-violet-400",
  emerald: "from-emerald-600 to-emerald-400",
  blue: "from-blue-600 to-cyan-400",
  amber: "from-amber-600 to-amber-400",
  pink: "from-pink-600 to-rose-400",
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = "sm",
  color = "violet",
  showLabel = false,
  animated = false,
  className,
  ...props
}) => {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <div
        className={cn(
          "flex-1 bg-white/10 rounded-full overflow-hidden",
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            colorMap[color],
            animated && "animate-pulse"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-white/50 w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
};
