import * as React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle" | "card";
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rect",
  lines = 1,
  ...props
}) => {
  const base =
    "animate-pulse bg-white/5 rounded-lg";

  if (variant === "text") {
    return (
      <div className="flex flex-col gap-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              base,
              "h-4",
              i === lines - 1 && lines > 1 ? "w-4/5" : "w-full",
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={cn(base, "rounded-full aspect-square", className)}
        {...props}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/5 bg-white/3 p-6 space-y-4",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className={cn(base, "h-10 w-10 rounded-full")} />
          <div className="flex-1 space-y-2">
            <div className={cn(base, "h-4 w-2/3")} />
            <div className={cn(base, "h-3 w-1/3")} />
          </div>
        </div>
        <div className={cn(base, "h-24 w-full")} />
        <div className="space-y-2">
          <div className={cn(base, "h-3 w-full")} />
          <div className={cn(base, "h-3 w-4/5")} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(base, className)} {...props} />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-white/5">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="h-3" />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1">
              <Skeleton
                className={cn(
                  "h-4",
                  c === 0 ? "w-3/4" : c === cols - 1 ? "w-1/2" : "w-full"
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-white/5 bg-white/3 p-5 space-y-3"
      >
        <div className="flex justify-between items-start">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);
