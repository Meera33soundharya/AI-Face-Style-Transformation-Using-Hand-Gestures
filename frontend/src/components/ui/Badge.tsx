import * as React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
}

const variantMap: Record<string, string> = {
  default: "bg-white/10 text-white/70 border-white/10",
  success:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/15 text-amber-400 border-amber-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  purple: "bg-violet-500/15 text-violet-400 border-violet-500/20",
};

const dotColorMap: Record<string, string> = {
  default: "bg-white/50",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-blue-400",
  purple: "bg-violet-400",
};

const sizeMap: Record<string, string> = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColorMap[variant])}
        />
      )}
      {children}
    </span>
  );
};

// Status badge helper
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<
    string,
    { variant: BadgeProps["variant"]; label: string }
  > = {
    completed: { variant: "success", label: "Completed" },
    processing: { variant: "info", label: "Processing" },
    failed: { variant: "error", label: "Failed" },
    pending: { variant: "warning", label: "Pending" },
  };
  const cfg = map[status] || { variant: "default", label: status };
  return (
    <Badge variant={cfg.variant} dot>
      {cfg.label}
    </Badge>
  );
};
