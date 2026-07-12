import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn, STAGGER_CONTAINER, ANIMATION_VARIANTS } from "../../lib/utils";
import { statsCards } from "../../data/mockData";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> =
  {
    Sparkles,
    Users,
    Zap,
    TrendingUp,
  };

const colorMap: Record<
  string,
  { bg: string; icon: string; glow: string; badge: string }
> = {
  purple: {
    bg: "from-violet-500/20 to-violet-500/5",
    icon: "bg-violet-500/20 text-violet-400",
    glow: "shadow-violet-500/10",
    badge: "text-violet-400",
  },
  blue: {
    bg: "from-blue-500/20 to-blue-500/5",
    icon: "bg-blue-500/20 text-blue-400",
    glow: "shadow-blue-500/10",
    badge: "text-blue-400",
  },
  cyan: {
    bg: "from-cyan-500/20 to-cyan-500/5",
    icon: "bg-cyan-500/20 text-cyan-400",
    glow: "shadow-cyan-500/10",
    badge: "text-cyan-400",
  },
  emerald: {
    bg: "from-emerald-500/20 to-emerald-500/5",
    icon: "bg-emerald-500/20 text-emerald-400",
    glow: "shadow-emerald-500/10",
    badge: "text-emerald-400",
  },
};

export const StatsCards: React.FC = () => {
  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {statsCards.map((card) => {
        const Icon = iconMap[card.icon];
        const colors = colorMap[card.color] || colorMap.purple;
        const isUp = card.trend === "up";

        return (
          <motion.div
            key={card.title}
            variants={ANIMATION_VARIANTS.slideUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
              "relative rounded-2xl border border-white/8 p-5 overflow-hidden",
              "bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md",
              `shadow-xl ${colors.glow}`
            )}
          >
            {/* Background gradient */}
            <div
              className={cn(
                "absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-40 bg-gradient-to-br",
                colors.bg
              )}
            />

            {/* Content */}
            <div className="relative flex items-start justify-between mb-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  colors.icon
                )}
              >
                {Icon && <Icon size={20} />}
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                  isUp
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                )}
              >
                {isUp ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {card.change}
              </span>
            </div>

            <div className="relative">
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-white/40 mt-1">{card.title}</p>
            </div>

            {/* Mini sparkline-like decoration */}
            <div className="relative mt-3 flex items-end gap-0.5 h-6">
              {[40, 65, 45, 80, 55, 90, 70].map((h, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 rounded-sm opacity-40",
                    colors.icon.split(" ")[0]
                  )}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
