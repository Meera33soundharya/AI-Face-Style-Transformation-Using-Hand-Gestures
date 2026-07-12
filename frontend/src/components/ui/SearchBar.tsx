import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  loading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  onClear,
  loading,
  value,
  onChange,
  placeholder = "Search...",
  ...props
}) => {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        size={16}
        className="absolute left-3 text-white/30 pointer-events-none"
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-white/30",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 focus:bg-white/8",
          "transition-all duration-200"
        )}
        {...props}
      />
      {loading && (
        <div className="absolute right-3">
          <div className="h-4 w-4 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
