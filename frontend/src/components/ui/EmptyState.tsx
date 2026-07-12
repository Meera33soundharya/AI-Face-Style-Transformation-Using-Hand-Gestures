import React from "react";
import { motion } from "framer-motion";
import { Inbox, Search, FileX, Users, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

type EmptyStateType = "data" | "search" | "error" | "users" | "activity";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const configs: Record<
  EmptyStateType,
  {
    icon: React.FC<any>;
    title: string;
    description: string;
    iconClass: string;
  }
> = {
  data: {
    icon: Inbox,
    title: "No data yet",
    description: "There's nothing here yet. Start by creating something new.",
    iconClass: "text-violet-400 bg-violet-500/15",
  },
  search: {
    icon: Search,
    title: "No results found",
    description:
      "We couldn't find anything matching your search. Try different keywords.",
    iconClass: "text-blue-400 bg-blue-500/15",
  },
  error: {
    icon: FileX,
    title: "Failed to load",
    description:
      "Something went wrong while loading this content. Please try again.",
    iconClass: "text-red-400 bg-red-500/15",
  },
  users: {
    icon: Users,
    title: "No users found",
    description: "There are no users matching the current filters.",
    iconClass: "text-emerald-400 bg-emerald-500/15",
  },
  activity: {
    icon: Zap,
    title: "No activity yet",
    description: "Once you start using the platform, your activity will show up here.",
    iconClass: "text-amber-400 bg-amber-500/15",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "data",
  title,
  description,
  action,
  className,
}) => {
  const cfg = configs[type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div
        className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center mb-4",
          cfg.iconClass
        )}
      >
        <Icon size={28} />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">
        {title || cfg.title}
      </h3>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-6">
        {description || cfg.description}
      </p>
      {action && (
        <Button variant="gradient" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};
