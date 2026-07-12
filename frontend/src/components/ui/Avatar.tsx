import * as React from "react";
import { cn } from "../../lib/utils";
import { getInitials } from "../../lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const onlineDotMap = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "",
  fallback = "U",
  size = "md",
  online,
  className,
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn("relative flex-shrink-0", className)} {...props}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold overflow-hidden",
          sizeMap[size]
        )}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white">
            {getInitials(fallback)}
          </div>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-slate-900",
            onlineDotMap[size],
            online ? "bg-emerald-500" : "bg-slate-500"
          )}
        />
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<{
  avatars: Array<{ fallback: string; src?: string }>;
  max?: number;
  size?: AvatarProps["size"];
}> = ({ avatars, max = 3, size = "sm" }) => {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((a, i) => (
        <Avatar
          key={i}
          src={a.src}
          fallback={a.fallback}
          size={size}
          className="ring-2 ring-slate-900"
        />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center bg-white/10 text-white/70 font-medium ring-2 ring-slate-900 text-xs",
            sizeMap[size]
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};
