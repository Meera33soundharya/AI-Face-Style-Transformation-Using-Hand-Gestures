import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  className,
}) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            className={cn(
              "relative h-full w-80 bg-slate-900/98 border-white/10 shadow-2xl backdrop-blur-xl flex flex-col",
              side === "right" ? "ml-auto border-l" : "mr-auto border-r",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              {title && (
                <h3 className="text-base font-semibold text-white">{title}</h3>
              )}
              <button
                onClick={onClose}
                className="ml-auto text-white/40 hover:text-white/80 transition-colors rounded-lg p-1.5 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
